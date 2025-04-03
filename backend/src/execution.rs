//rocket stuff for backend
use rocket::http::Status; // to return a status code
use rocket::serde::{Serialize, Deserialize, json::Json}; // for handling jsons
use rocket::State; // for handling state???
use rocket::request::{FromRequest, Outcome}; //for outcome and optional handling
use rocket::Route;
use rocket_ws::{Message, WebSocket, stream::MessageStream, result::Error}; // WebSocket support
use rocket_ws::Channel;

//for jsons
use serde_json::json;
//for our db connection
use rusqlite::{Connection, Result as SqlResult, OptionalExtension, params_from_iter};
// for thread-safe access
use std::sync::{Arc, Mutex}; 

//utoipa for swagger
use utoipa::{OpenApi, ToSchema, IntoParams};
use utoipa::openapi::security::{SecurityScheme, ApiKeyValue};
use utoipa::openapi::security::ApiKey as UtoipaApiKey;
use utoipa_swagger_ui::SwaggerUi;

//for hashing and verifying values
use bcrypt::{DEFAULT_COST, hash, verify};
//for uuid values
use uuid::Uuid;

//for windows commands and processes
use std::process::Command;
use std::collections::HashMap;
use std::process::ExitStatus;

//for winapi handling
use winapi::um::processthreadsapi::OpenProcess;
use winapi::um::winnt::PROCESS_TERMINATE;
use winapi::um::processthreadsapi::TerminateProcess;

//for handling dates
use chrono::{DateTime, Utc, Duration, TimeDelta};

//for our db
use crate::DB;
use crate::utils::*;
use crate::models::*;  // Now Login, User, and other public items are in scope
use crate::SessionGuard;

use rusqlite::params;

//For ddebugging
use rocket::info;

//for len, why isnt it usable by default?
use crate::rocket::form::validate::Len;

use tokio::sync::broadcast; // For sending updates to WebSocket clients
use tokio::task; // For spawning async tasks
use tokio::time::{sleep, Duration as TokioDuration}; // For async delays in background monitoring tasks
use futures_util::{StreamExt, SinkExt, stream}; // Required for `split()`
use futures_util::stream::Stream;
pub type ProcessConnections = Arc<Mutex<HashMap<String, broadcast::Sender<String>>>>;
pub type ProcessMap = Arc<Mutex<HashMap<String, ProcessInfo>>>;
pub type AppProcessMap = Arc<Mutex<HashMap<String, String>>>;  // application_id -> process_id
pub type ProcessCountChannel = Arc<Mutex<Option<broadcast::Sender<usize>>>>; // Used for sending process count updates

#[utoipa::path(
    post,
    path = "/api/execute",
    tag = "Program Management",
    responses(
        (status = 200, description = "Executable launched successfully"),
        (status = 400, description = "Invalid application ID or missing path"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Failed to launch executable")
    ),
    security(
        ("session_id" = [])
    ),
    request_body = ExecuteRequest
)]
#[post("/api/execute", data = "<request>")]
fn execute_program(
    _session_id: SessionGuard,
    request: Json<ExecuteRequest>,
    process_map: &State<ProcessMap>,
    app_process_map: &State<AppProcessMap>,  // State for app_id -> process_id
    connections: &State<ProcessConnections>,
    process_count_channel: &State<ProcessCountChannel>,  // For sending process count updates
    db: &rocket::State<Arc<DB>>,
) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap();

    // Get the executable path from the database
    let query = "SELECT path FROM Instructions WHERE application_id = ?";
    let path: SqlResult<String> = conn.query_row(query, [&request.application_id], |row| row.get(0));

    let path = match path {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Database error: {}", e);
            return Err(Status::BadRequest);
        }
    };

    // Launch the application
    match Command::new(&path).spawn() {
        Ok(child) => {
            let process_id = child.id().to_string();  // The actual PID
            let application_id = request.application_id.clone();

            println!("Launched application {} with process ID {}", application_id, process_id);

            // Store the process ID in the application process map
            app_process_map.lock().unwrap().insert(application_id.clone(), process_id.clone());

            // Store process tracking info
            add_process(
                process_id.clone(),
                child.id(),
                Arc::clone(process_map),
                Arc::clone(connections),
                Arc::clone(process_count_channel),
            );


            Ok(Json(json!({
                "status": "success",
                "process_id": process_id,
                "application_id": application_id
            })))
        }
        Err(e) => {
            eprintln!("Failed to launch executable: {}", e);
            Err(Status::InternalServerError)
        }
    }
}



// WebSocket handler for process status updates
#[get("/ws/process/<process_id>")]
fn ws_process_status(
    process_id: String,
    ws: WebSocket,
    connections: &State<ProcessConnections>,
    process_map: &State<ProcessMap>,
) -> Result<MessageStream<'static, impl Stream<Item = Result<Message, Error>>>, Status> {
    println!("WebSocket connection requested for process {process_id}");

    // If process does NOT exist, reject the WebSocket connection
    if !process_map.lock().unwrap().contains_key(&process_id) {
        return Err(Status::NotFound);  // Return HTTP 404
    }

    let receiver = {
        let mut conn_map = connections.lock().unwrap();
        let entry = conn_map.entry(process_id.clone()).or_insert_with(|| {
            let (tx, _) = broadcast::channel(10);
            println!("WebSocket channel created for process {process_id}");
            tx
        });

        println!("WebSocket client subscribed to process {process_id}");
        entry.subscribe()
    };

    let process_id_clone = process_id.clone();
    let connections_clone = Arc::clone(connections); // Ensure Arc cloning

    Ok(ws.stream(move |_| {
        futures_util::stream::unfold(receiver, move |mut rx| {
            let process_id = process_id_clone.clone();
            let connections = Arc::clone(&connections_clone); // Clone Arc again for each iteration

            async move {
                match rx.recv().await {
                    Ok(msg) => {
                        println!("WebSocket received message: {}", msg);
                        Some((Ok(Message::Text(msg)), rx))
                    }
                    Err(_) => {
                        // Only remove the connection if the process is truly stopped
                        let mut conn_map = connections.lock().unwrap();
                        if conn_map.contains_key(&process_id) {
                            println!("WebSocket connection lost for process {process_id}, but keeping it active.");
                        }

                        None // Terminate the WebSocket stream
                    }
                }
            }
        })
    }))
}

// Function to notify WebSocket clients
fn notify_clients(process_id: &str, status: &str, connections: &ProcessConnections) {
    if let Some(sender) = connections.lock().unwrap().get(process_id) {
        if let Err(e) = sender.send(status.to_string()) {
            eprintln!("WebSocket sender failed for process {}: {}", process_id, e);
        } else {
            println!("WebSocket message sent successfully!");
        }
    } else {
        println!("No WebSocket clients found for process {}", process_id);
    }
}


// Function to get child PIDs of a given process
fn get_child_pids(parent_pid: u32) -> Vec<u32> {
    let output = Command::new("wmic")
        .args(&["process", "where", format!("ParentProcessId={}", parent_pid).as_str(), "get", "ProcessId"])
        .output();

    if let Ok(output) = output {
        let stdout = String::from_utf8_lossy(&output.stdout);
        stdout
            .lines()
            .skip(1)
            .filter_map(|line| line.trim().parse::<u32>().ok())
            .collect()
    } else {
        vec![]
    }
}

// **Background Task: Monitors Parent and Child Process Status**
fn monitor_process(
    process_id: String, 
    pid: u32, 
    process_map: ProcessMap, 
    connections: ProcessConnections, 
    process_count_channel: ProcessCountChannel
) {
    println!("Monitoring process {process_id} (PID {pid})");

    task::spawn(async move {
        loop {
            sleep(TokioDuration::from_secs(3)).await;

            // Check if process is still in process_map
            {
                let map = process_map.lock().unwrap();
                if !map.contains_key(&process_id) {
                    println!("Monitoring stopped for process {process_id} (PID {pid} was explicitly removed).");
                    notify_clients(&process_id, "Stopped", &connections);
                    return; // Exit loop if the process was explicitly removed
                }
            }

            let mut is_running = Command::new("tasklist")
                .arg("/FI")
                .arg(format!("PID eq {}", pid))
                .output()
                .map(|output| String::from_utf8_lossy(&output.stdout).contains(&pid.to_string()))
                .unwrap_or(false);

            // Also check child processes
            {
                let map = process_map.lock().unwrap();
                if let Some(proc_info) = map.get(&process_id) {
                    let child_pids = proc_info.child_pids.lock().unwrap();
                    is_running |= child_pids.iter().any(|&child_pid| {
                        Command::new("tasklist")
                            .arg("/FI")
                            .arg(format!("PID eq {}", child_pid))
                            .output()
                            .map(|output| String::from_utf8_lossy(&output.stdout).contains(&child_pid.to_string()))
                            .unwrap_or(false)
                    });
                }
            }


            if !is_running {
                println!("Process {process_id} (PID {pid}) stopped, notifying clients...");
                
                notify_clients(&process_id, "Stopped", &connections);

                remove_process(&process_id, &process_map, &process_count_channel);
                break;
            }
        }
    });
}


// **Track and Monitor a New Process**
fn add_process(process_id: String, pid: u32, process_map: ProcessMap, connections: ProcessConnections, process_count_channel: ProcessCountChannel) {
    let child_pids = get_child_pids(pid);

    {
        let mut map = process_map.lock().unwrap();
        map.insert(
            process_id.clone(),
            ProcessInfo {
                pid,
                child_pids: Arc::new(Mutex::new(child_pids.clone())),
                status: Arc::new(Mutex::new("Running".to_string())),
                exit_code: Arc::new(Mutex::new(None)),
            },
        );
    }

    notify_process_count(&process_map, &process_count_channel);  // Notify WebSocket clients of process count
    // Start monitoring this process
    monitor_process(process_id, pid, process_map, connections, process_count_channel);
}

fn remove_process(
    process_id: &str,
    process_map: &ProcessMap,
    process_count_channel: &ProcessCountChannel,
) {
    {
        let mut map = process_map.lock().unwrap();
        if map.remove(process_id).is_some() {
            println!("Process {} removed", process_id);
        }
    }

    notify_process_count(&process_map, &process_count_channel);
}

#[get("/ws/process_count")]
fn ws_process_count(
    ws: WebSocket,
    process_count_channel: &State<ProcessCountChannel>,
    process_map: &State<ProcessMap>, // Add process_map to get the current count
) -> MessageStream<'static, impl Stream<Item = Result<Message, Error>>> {
    println!("WebSocket connection opened for process count updates");

    let receiver = {
        let mut channel = process_count_channel.lock().unwrap();
        if channel.is_none() { // Create the channel if it doesn't exist
            let (tx, rx) = broadcast::channel(10);
            *channel = Some(tx);
            println!("Process count broadcast channel initialized");
            rx
        } else {
            channel.as_ref().unwrap().subscribe()
        }
    };

    // Get the current process count
    let current_count = process_map.lock().unwrap().len();

    // Create a stream of updates for the WebSocket client
    let updates = futures_util::stream::unfold(receiver, |mut rx| async {
        match rx.recv().await {
            Ok(count) => Some((Ok(Message::Text(count.to_string())), rx)),
            Err(_) => None, // Terminate the WebSocket stream on error
        }
    });

    // Combine the initial message with the updates
    let initial_message = futures_util::stream::once(async move {
        Ok(Message::Text(current_count.to_string()))
    });

    // Concatenate the initial message and the updates
    let message_stream = initial_message.chain(updates);

    // Wrap the message_stream in a closure
    ws.stream(move |_| message_stream)
}

fn notify_process_count(process_map: &ProcessMap, process_count_channel: &ProcessCountChannel) {
    let count = process_map.lock().unwrap().len();
    println!("notify_process_count called. Current running process count: {}", count);

    if let Some(sender) = process_count_channel.lock().unwrap().clone() {
        if let Err(e) = sender.send(count) {
            eprintln!("Failed to send process count update: {}", e);
        }
    } else {
        println!("No active process count channel found! (WebSocket client may not be connected)");
    }
}

#[utoipa::path(
    delete,
    path = "/api/process/{application_id}/stop",
    tag = "Program Management",
    params(
        ("application_id" = String, Path, description = "Application ID to stop"),
    ),
    responses(
        (status = 200, description = "Process stopped successfully"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Process not found"),
        (status = 500, description = "Failed to stop process"),
    ),
    security(
        ("session_id" = [])
    )
)]
#[delete("/api/process/<identifier>/stop")]
fn stop_process(
    _session_id: SessionGuard,
    identifier: String, // Can be application_id OR process_id
    process_map: &State<ProcessMap>,    // For tracking process status
    app_process_map: &State<AppProcessMap>,  // For association application id with process id
    connections: &State<ProcessConnections>,
    process_count_channel: &State<ProcessCountChannel>
) -> Result<Json<serde_json::Value>, Status> {
    println!("Received request to stop process: {}", identifier);

    let process_id = if identifier.contains("-") {
        app_process_map.lock().unwrap().get(&identifier).cloned().ok_or(Status::NotFound)?
    } else {
        identifier.clone()
    };

    let process_info = process_map.lock().unwrap().remove(&process_id).ok_or(Status::NotFound)?;

    let parent_pid = process_info.pid;
    let child_pids = process_info.child_pids.lock().unwrap().clone();

    println!("Stopping process {} (Parent PID: {}, Child PIDs: {:?})", identifier, parent_pid, child_pids);

    for pid in &child_pids {
        if let Err(e) = Command::new("taskkill").args(&["/PID", &pid.to_string(), "/F"]).status() {
            eprintln!("Failed to kill child process {}: {:?}", pid, e);
        } else {
            println!("Child process {} terminated successfully", pid);
        }
    }

    if Command::new("tasklist")
        .arg("/FI")
        .arg(format!("PID eq {}", parent_pid))
        .output()
        .map(|output| String::from_utf8_lossy(&output.stdout).contains(&parent_pid.to_string()))
        .unwrap_or(false)
    {
        if let Err(e) = Command::new("taskkill").args(&["/PID", &parent_pid.to_string(), "/F"]).status() {
            eprintln!("Failed to terminate parent process {}: {:?}", parent_pid, e);
        } else {
            println!("Parent process {} terminated successfully", parent_pid);
        }
    } else {
        println!("Warning: Parent process {} was not found and may have already exited", parent_pid);
    }

    remove_process(&process_id, process_map, process_count_channel);

    Ok(Json(json!({
        "status": "success",
        "message": format!("Process {} stopped successfully", identifier),
    })))
}


#[utoipa::path(
    post,
    path = "/api/applications/add",
    tag = "Program Management",
    responses(
        (status = 200, description = "Application added successfully"),
        (status = 400, description = "Invalid application data"),
        (status = 500, description = "Failed to add application")
    ),
    security(
        ("session_id" = [])
    ),
    request_body = ApplicationEntry
)]
#[post("/api/applications/add", data = "<application_data>")]
fn add_application(
    _session_id: SessionGuard, // User session verification
    application_data: Json<ApplicationEntry>,
    db: &rocket::State<Arc<DB>>,
) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap();

    // Validate user permissions
    let actor = session_to_user(_session_id.0.clone(), &conn);
    let actor = user_name_search(actor, &conn);
    let actor_role = user_role_search(actor.clone(), &conn);
    let actor_role: i32 = actor_role.parse().expect("Not a valid number");

    if actor.is_empty() {
        return Err(Status::Unauthorized);
    }
    
    if actor_role > 2 {
        return Err(Status::Unauthorized); // Only Superadmin (1) or Admin (2) can add applications
    }

    // Validate the path
    let path = &application_data.executable_path;
    if !std::path::Path::new(path).exists() {
        return Err(Status::BadRequest);
    }
    
    let application_id = Uuid::new_v4().to_string();
    let instruction_id = Uuid::new_v4().to_string();

    // Use provided contact or set to NULL
    let contact = application_data.contact.as_deref();

    let query = "INSERT INTO Application (id, userId, contact, name, description) VALUES (?1, ?2, ?3, ?4, ?5)";
    let result = conn.execute(
        query,
        params![
            &application_id,
            &application_data.user_id,
            contact, // Can be NULL if not provided
            &application_data.name,
            &application_data.description
        ],
    );

    if let Err(e) = result {
        error!("Database error while inserting application: {:?}", e);
        return Err(Status::InternalServerError);
    }

    // Insert into CategoryApplication table (if categories are provided)
    if let Some(category_ids) = &application_data.category_ids {
        for category_id in category_ids {
            let query = "INSERT INTO CategoryApplication (application_id, category_id) VALUES (?1, ?2)";
            if let Err(e) = conn.execute(query, params![&application_id, category_id]) {
                error!("Database error while inserting category mapping: {:?}", e);
                return Err(Status::InternalServerError);
            }
        }
    }

    // Insert into Instructions table
    let query = "INSERT INTO Instructions (id, application_id, path, arguments) VALUES (?1, ?2, ?3, ?4)";
    let result = conn.execute(
        query,
        params![
            &instruction_id,
            &application_id,
            &application_data.executable_path,
            &application_data.arguments.clone().unwrap_or("".to_string())
        ],
    );

    if let Err(e) = result {
        error!("Database error while inserting application: {:?}", e);
        return Err(Status::InternalServerError);
    }

    Ok(Json(json!({
        "status": "success",
        "message": "Application added successfully",
        "application_id": application_id,
        "instruction_id": instruction_id
    })))
}

#[utoipa::path(
    delete,
    path = "/api/applications/remove/{application_id}",
    tag = "Program Management",
    responses(
        (status = 200, description = "Application removed successfully"),
        (status = 400, description = "Invalid application ID"),
        (status = 403, description = "Unauthorized"),
        (status = 500, description = "Failed to remove application")
    ),
    security(
        ("session_id" = [])
    ),
    params(
        ("application_id" = String, Path, description = "The ID of the application to remove")
    )
)]
#[delete("/api/applications/remove/<application_id>")]
fn remove_application(
    _session_id: SessionGuard,
    application_id: String,
    db: &rocket::State<Arc<DB>>,
) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap();

    // Validate
    let actor = session_to_user(_session_id.0.clone(), &conn);
    let actor = user_name_search(actor, &conn);
    let actor_role = user_role_search(actor.clone(), &conn);
    let actor_role: i32 = actor_role.parse().expect("Not a valid number");

    if actor.is_empty() {
        return Err(Status::Unauthorized);
    }

    if actor_role > 2 {
        return Err(Status::Unauthorized); // Only Superadmin (1) or Admin (2) can remove applications
    }

    // Remove category mappings from CategoryApplication table
    let query = "DELETE FROM CategoryApplication WHERE application_id = ?1";
    if let Err(e) = conn.execute(query, &[&application_id]) {
        error!("Database error while deleting category mappings: {:?}", e);
        return Err(Status::InternalServerError);
    }

    // Remove instructions (the cascades should handle this, but this is just to be safe)
    let query = "DELETE FROM Instructions WHERE application_id = ?1";
    if let Err(e) = conn.execute(query, &[&application_id]) {
        error!("Database error while deleting instructions: {:?}", e);
        return Err(Status::InternalServerError);
    }

    // Remove the application
    let query = "DELETE FROM Application WHERE id = ?1";
    if let Err(e) = conn.execute(query, &[&application_id]) {
        error!("Database error while deleting application: {:?}", e);
        return Err(Status::InternalServerError);
    }

    Ok(Json(json!({
        "status": "success",
        "message": "Application removed successfully",
        "application_id": application_id
    })))
}

#[utoipa::path(
    get,
    path = "/api/applications/{application_id}",
    tag = "Program Management",
    responses(
        (status = 200, description = "Application details retrieved successfully", body = ApplicationDetails),
        (status = 404, description = "Application not found"),
        (status = 500, description = "Failed to retrieve application")
    ),
    security(
        ("session_id" = [])
    ),
    params(
        ("application_id" = String, Path, description = "The ID of the application to retrieve")
    )
)]
#[get("/api/applications/<application_id>")]
fn get_application(
    _session_id: SessionGuard,
    application_id: String,
    db: &rocket::State<Arc<DB>>,
) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap();

    // Get application details
    let query = "SELECT id, userId, contact, name, description FROM Application WHERE id = ?";
    let mut stmt = match conn.prepare(query) {
        Ok(stmt) => stmt,
        Err(e) => {
            error!("Database error while preparing application query: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    let mut application: ApplicationDetails = match stmt.query_row([&application_id], |row| {
        Ok(ApplicationDetails {
            id: row.get(0)?,
            user_id: row.get(1)?,
            contact: row.get(2)?,
            name: row.get(3)?,
            description: row.get(4)?,
            categories: vec![], // Placeholder, will be updated below
        })
    }) {
        Ok(app) => app,
        Err(rusqlite::Error::QueryReturnedNoRows) => return Err(Status::NotFound),
        Err(e) => {
            error!("Database error while retrieving application: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    // Get category details (instead of just IDs)
    let query = "SELECT c.id, c.name, c.description FROM CategoryApplication ca
                 JOIN Category c ON ca.category_id = c.id WHERE ca.application_id = ?";
    let mut stmt = match conn.prepare(query) {
        Ok(stmt) => stmt,
        Err(e) => {
            error!("Database error while preparing category query: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    let category_result: Result<Vec<CategoryDetails>, _> = stmt
        .query_map([&application_id], |row| {
            Ok(CategoryDetails {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2).ok(),
            })
        })
        .and_then(|rows| rows.collect());

    application.categories = match category_result {
        Ok(categories) => categories,
        Err(_) => vec![], // No categories found
    };

    // Get associated instructions
    let query = "SELECT path, arguments FROM Instructions WHERE application_id = ?";
    let mut stmt = match conn.prepare(query) {
        Ok(stmt) => stmt,
        Err(e) => {
            error!("Database error while preparing instructions query: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    let instructions = match stmt.query_row([&application_id], |row| {
        Ok(InstructionsDetails {
            path: row.get(0)?,
            arguments: row.get(1).ok(),
        })
    }) {
        Ok(instr) => instr,
        Err(rusqlite::Error::QueryReturnedNoRows) => InstructionsDetails {
            path: "".to_string(),
            arguments: None,
        },
        Err(e) => {
            error!("Database error while retrieving instructions: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    Ok(Json(json!({
        "status": "success",
        "application": application,
        "instructions": instructions
    })))
}

#[utoipa::path(
    get,
    path = "/api/applications",
    tag = "Program Management",
    responses(
        (status = 200, description = "List of all applications retrieved successfully", body = [ApplicationDetails]),
        (status = 500, description = "Failed to retrieve applications")
    ),
    security(
        ("session_id" = []),
    )
)]
#[get("/api/applications")]
fn get_all_applications(
    _session_id: SessionGuard,
    db: &rocket::State<Arc<DB>>,
) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap();

    // Retrieve all applications
    let query = "SELECT id, userId, contact, name, description FROM Application";
    let mut stmt = match conn.prepare(query) {
        Ok(stmt) => stmt,
        Err(e) => {
            error!("Database error while preparing applications query: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    let applications_result: Result<Vec<ApplicationDetails>, _> = stmt
        .query_map([], |row| {
            Ok(ApplicationDetails {
                id: row.get(0)?,
                user_id: row.get(1)?,
                contact: row.get(2)?,
                name: row.get(3)?,
                description: row.get(4)?,
                categories: vec![], // Placeholder, will be updated
            })
        })
        .map_err(|e| {
            error!("Database error while retrieving applications: {:?}", e);
            Status::InternalServerError
        })?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| {
            error!("Database error while collecting applications: {:?}", e);
            Status::InternalServerError
        });

    let mut applications = match applications_result {
        Ok(apps) => apps,
        Err(status) => return Err(status),
    };

    // Retrieve all category associations
    let query = "
        SELECT ca.application_id, c.id, c.name, c.description
        FROM CategoryApplication ca
        JOIN Category c ON ca.category_id = c.id";
    let mut stmt = match conn.prepare(query) {
        Ok(stmt) => stmt,
        Err(e) => {
            error!("Database error while preparing category query: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    let mut category_map: HashMap<String, Vec<CategoryDetails>> = HashMap::new();

    let category_result = stmt.query_map([], |row| {
        let application_id: String = row.get(0)?;
        let category_id: String = row.get(1)?;
        let category_name: String = row.get(2)?;
        let category_description: Option<String> = row.get(3).ok();

        Ok((application_id, CategoryDetails {
            id: category_id,
            name: category_name,
            description: category_description,
        }))
    });

    match category_result {
        Ok(rows) => {
            for row in rows {
                match row {
                    Ok((application_id, category)) => {
                        category_map.entry(application_id).or_default().push(category);
                    }
                    Err(e) => {
                        error!("Database error while processing category row: {:?}", e);
                        return Err(Status::InternalServerError);
                    }
                }
            }
        }
        Err(e) => {
            error!("Database error while retrieving categories: {:?}", e);
            return Err(Status::InternalServerError);
        }
    }

    // Retrieve all instructions
    let query = "SELECT application_id, path, arguments FROM Instructions";
    let mut stmt = match conn.prepare(query) {
        Ok(stmt) => stmt,
        Err(e) => {
            error!("Database error while preparing instructions query: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    let mut instructions_map: HashMap<String, InstructionsDetails> = HashMap::new();

    let instructions_result = stmt.query_map([], |row| {
        let application_id: String = row.get(0)?;
        let instruction = InstructionsDetails {
            path: row.get(1)?,
            arguments: row.get(2).ok(),
        };
        Ok((application_id, instruction))
    });

    match instructions_result {
        Ok(rows) => {
            for row in rows {
                match row {
                    Ok((application_id, instruction)) => {
                        instructions_map.insert(application_id, instruction);
                    }
                    Err(e) => {
                        error!("Database error while processing instruction row: {:?}", e);
                        return Err(Status::InternalServerError);
                    }
                }
            }
        }
        Err(e) => {
            error!("Database error while retrieving instructions: {:?}", e);
            return Err(Status::InternalServerError);
        }
    }

    // Merge applications with their categories and instructions
    let applications_with_details: Vec<_> = applications
        .into_iter()
        .map(|mut app| {
            app.categories = category_map.remove(&app.id).unwrap_or_default();
            let instructions = instructions_map
                .get(&app.id)
                .cloned()
                .unwrap_or_else(|| InstructionsDetails {
                    path: "".to_string(),
                    arguments: None,
                });

            json!({
                "application": app,
                "instructions": instructions
            })
        })
        .collect();

    Ok(Json(json!({
        "status": "success",
        "applications": applications_with_details
    })))
}

#[utoipa::path(
    post,
    path = "/api/categories/add",
    tag = "Category Management",
    responses(
        (status = 200, description = "Category added successfully"),
        (status = 400, description = "Invalid category data"),
        (status = 500, description = "Failed to add category")
    ),
    security(("session_id" = [])),
    request_body = CategoryEntry
)]
#[post("/api/categories/add", data = "<category_data>")]
fn add_category(
    _session_id: SessionGuard,
    category_data: Json<CategoryEntry>,
    db: &rocket::State<Arc<DB>>,
) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap();

    // Validate user permissions
    let actor = session_to_user(_session_id.0.clone(), &conn);
    let actor = user_name_search(actor, &conn);
    let actor_role = user_role_search(actor.clone(), &conn);
    let actor_role: i32 = actor_role.parse().expect("Not a valid number");

    if actor.is_empty() || actor_role > 2 {
        return Err(Status::Unauthorized); // Only Superadmins (1) & Admins (2) can create categories
    }

    let category_id = Uuid::new_v4().to_string();

    let query = "INSERT INTO Category (id, name, description) VALUES (?1, ?2, ?3)";
    let result = conn.execute(
        query,
        params![
            &category_id,
            &category_data.name,
            &category_data.description.clone().unwrap_or("".to_string())
        ],
    );

    if let Err(e) = result {
        error!("Database error while inserting category: {:?}", e);
        return Err(Status::InternalServerError);
    }

    Ok(Json(json!({
        "status": "success",
        "message": "Category added successfully",
        "category_id": category_id
    })))
}

#[utoipa::path(
    delete,
    path = "/api/categories/{category_id}/delete",
    tag = "Category Management",
    responses(
        (status = 200, description = "Category deleted successfully"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Category not found"),
        (status = 500, description = "Failed to delete category")
    ),
    security(("session_id" = [])),
    params(
        ("category_id" = String, Path, description = "The ID of the category to delete")
    )
)]
#[delete("/api/categories/<category_id>/delete")]
fn delete_category(
    _session_id: SessionGuard,
    category_id: String,
    db: &rocket::State<Arc<DB>>,
) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap();

    // Validate user permissions
    let actor = session_to_user(_session_id.0.clone(), &conn);
    let actor = user_name_search(actor, &conn);
    let actor_role = user_role_search(actor.clone(), &conn);
    let actor_role: i32 = actor_role.parse().expect("Not a valid number");

    if actor.is_empty() || actor_role > 2 {
        return Err(Status::Unauthorized); // Only Superadmins (1) & Admins (2) can delete categories
    }

    // Check if category exists
    let query = "SELECT COUNT(*) FROM Category WHERE id = ?1";
    let category_exists: i64 = match conn.query_row(query, [&category_id], |row| row.get(0)) {
        Ok(count) => count,
        Err(_) => return Err(Status::InternalServerError),
    };

    if category_exists == 0 {
        return Err(Status::NotFound);
    }

    // Delete from CategoryApplication first (prevents foreign key constraint failure)
    let query = "DELETE FROM CategoryApplication WHERE category_id = ?1";
    if let Err(e) = conn.execute(query, [&category_id]) {
        error!("Database error while deleting category associations: {:?}", e);
        return Err(Status::InternalServerError);
    }

    // Delete category from Category table
    let query = "DELETE FROM Category WHERE id = ?1";
    let result = conn.execute(query, [&category_id]);

    if let Err(e) = result {
        error!("Database error while deleting category: {:?}", e);
        return Err(Status::InternalServerError);
    }

    Ok(Json(json!({
        "status": "success",
        "message": "Category deleted successfully",
        "category_id": category_id
    })))
}

#[utoipa::path(
    get,
    path = "/api/categories",
    tag = "Category Management",
    responses(
        (status = 200, description = "List of all categories retrieved successfully", body = [CategoryDetails]),
        (status = 500, description = "Failed to retrieve categories")
    ),
    security(("session_id" = []))
)]
#[get("/api/categories")]
fn get_all_categories(
    _session_id: SessionGuard,
    db: &rocket::State<Arc<DB>>,
) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap();

    let query = "SELECT id, name, description FROM Category";
    let mut stmt = match conn.prepare(query) {
        Ok(stmt) => stmt,
        Err(e) => {
            error!("Database error while preparing category query: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    let categories_result: Result<Vec<CategoryDetails>, _> = stmt
        .query_map([], |row| {
            Ok(CategoryDetails {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2).ok(), // Description is optional
            })
        })
        .and_then(|rows| rows.collect())
        .map_err(|e| {
            error!("Database error while retrieving categories: {:?}", e);
            Status::InternalServerError
        });

    let categories = match categories_result {
        Ok(cats) => cats,
        Err(status) => return Err(status),
    };

    Ok(Json(json!({
        "status": "success",
        "categories": categories
    })))
}

#[utoipa::path(
    patch,
    path = "/api/application/update",
    tag = "Program Management",
    responses(
        (status = 200, description = "Updates program info"),
        (status = 404, description = "Program not found")
    ),
    request_body = ApplicationUpdateForm,
    security(
        ("session_id" = [])
    ),
    )]
#[patch("/api/applications/update", data = "<application_data>")]
fn update_application(_session_id: SessionGuard, application_data: Json<ApplicationUpdateForm>, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let session_id = &_session_id.0;
    
    //session is that of the actor
    let actor = session_to_user(session_id.clone(), &conn);
    let actor = user_name_search(actor, &conn);

    
    if actor == "" { //if theyre not real (real)
        return Err(Status::NotFound);
    }

    let role = user_role_search(actor, &conn);

    //if they're a viewer
    if role == "3" {
        return Err(Status::Unauthorized);
    } 
    //------------------------------------------- done with authentication and authorization
    
    let mut stmt = conn.prepare("SELECT * FROM Application WHERE id = ?").unwrap();
    let mut rows = stmt.query(&[&application_data.id]).unwrap();

    if let Some(row) = rows.next().unwrap() {
        let id: String = row.get(0).unwrap();
        println!("{}", id);
    } else {
        return Err(Status::NotFound);
    }

    

    //------------------------------------------- done with checking the application

    // inserting into application

    // Validate the path
    if let Some(path) = &application_data.executable_path {
        if !std::path::Path::new(path).exists() {
            return Err(Status::BadRequest);
        }    
    }
    let mut query: String = "UPDATE Application SET".to_string();
    
    let fields = [
        ("name", &application_data.name),
        ("description", &application_data.description),
        ("userId", &application_data.user_id),
        ("contact", &application_data.contact),
    ];
    let mut updateVector = Vec::<&dyn rusqlite::ToSql>::new();  // Creates an empty vector
    let mut i = 1;
    
    //let query = "UPDATE User SET pass_hash = ?1 WHERE username = ?2";
    //let result = conn.execute(query, &[&pass_hash, &target]);
    //"UPDATE Application SET {} = ?1 WHERE id = ?2", label
    for (label, field) in fields.iter() {
        if let Some(value) = field {
            if i > 1 {
                query.push_str(",");  // Add comma only after the first field
            }
            query = format!("{} {} = ?{}", query, label, i);
            updateVector.push(value as &dyn rusqlite::ToSql);
            i += 1;
        }
    }
    query = format!("{} WHERE id = ?{}", query, i);
    let id: String = format!("{}", &application_data.id);
    updateVector.push(&application_data.id);
    println!("{}", query);
    let mut result = conn.execute(&query, rusqlite::params_from_iter(updateVector.iter()));

    match result {
        Ok(0) => return Err(Status::NotFound),
        Ok(_) => {

        }
        Err(e) => {
            eprintln!("Database error: {:?}", e);  // <-- Add this to log errors
            return Err(Status::InternalServerError);
        }
    }

    //-------------------------------------- Check instruction field

    let mut stmt = conn.prepare("SELECT * FROM Instructions WHERE application_id = ?").unwrap();
    let mut rows = stmt.query(&[&application_data.id]).unwrap();

    if let Some(row) = rows.next().unwrap() {
        println!("success");
    } else {
        return Err(Status::NotFound);
    }

    //------------------------------------ build query to update instruction field

    let mut query: String = "UPDATE Instructions SET".to_string(); 
    
    let fields = [ //they should make this a macro bro, they need some sort of query builder
        ("path", &application_data.executable_path),
        ("arguments", &application_data.arguments),
    ];
    let mut updateVector = Vec::<&dyn rusqlite::ToSql>::new();  // Creates an empty vector
    let mut i = 1;
    
    //let query = "UPDATE User SET pass_hash = ?1 WHERE username = ?2";
    //let result = conn.execute(query, &[&pass_hash, &target]);
    //"UPDATE Application SET {} = ?1 WHERE id = ?2", label
    for (label, field) in fields.iter() {
        if let Some(value) = field {
            if i > 1 {
                query.push_str(",");  // Add comma only after the first field
            }
            query = format!("{} {} = ?{}", query, label, i);
            updateVector.push(value as &dyn rusqlite::ToSql);
            i += 1;
        }
    }
    query = format!("{} WHERE application_id = ?{}", query, i);
    let id: String = format!("{}", &application_data.id);
    updateVector.push(&id);
    println!("{}", query);
    
    let mut result = conn.execute(&query, rusqlite::params_from_iter(updateVector.iter()));

    match result {
        Ok(0) => return Err(Status::NotFound),
        Ok(_) => {
        }//moveon to update instructions}
        Err(e) => {
            eprintln!("Database error: {:?}", e);  // <-- Add this to log errors
            return Err(Status::InternalServerError)
        }
    }

    //-- If no category passed
    if !application_data.categories.is_none() {
        //-- Checking if each category they passed is real (real)
        let category_names = application_data
            .categories
            .as_ref() // Convert Option<Vec<String>> to Option<&Vec<String>>
            .map(|categories| categories.join(", ")) // Join the vector with ", "
            .unwrap_or_else(|| "".to_string()); // Default to empty string if None    

        println!("category_names: {}", category_names);
        if application_data.categories.len() != 0 {
            let query: String = format!("SELECT COUNT(*) FROM Category WHERE id IN ({})", category_names);
            println!("{}", query);

            let mut stmt = conn.prepare(&query).unwrap();
            let mut result = stmt.query([]).unwrap();

            match result.next() {
                Ok(Some(unwrapped_row)) => {
                    let count: usize = unwrapped_row.get(0).unwrap();
                    if count != application_data.categories.len() {
                        return Err(Status::BadRequest); //an error with finding their categories
                    }
                }
                Ok(None) => {
                    return Err(Status::BadRequest); //nothing found, so clearly an issue
                }
                Err(e) => {
                    eprintln!("Database error: {:?}", e);  // <-- Add this to log errors
                    return Err(Status::InternalServerError)
                }
            }
        }
        

        //--just delete every category and add all in categories idiot
        let query = "DELETE FROM CategoryApplication WHERE application_id = ?";
        let result = conn.execute(&query, &[&application_data.id]);
        match result {
            Ok(_) => {
                //GOOD
            }
            Err(e) => {
                eprintln!("Database error: {:?}", e);  // <-- Add this to log errors
                return Err(Status::InternalServerError)
            }

        }

        if let Some(categories) = &application_data.categories {
            let query = "INSERT INTO CategoryApplication (application_id, category_id) VALUES (?1, ?2)";
            for category in categories.iter() {
                let result = conn.execute(&query, &[&application_data.id, &category]);
                match result {
                    Ok(_) => {
                        //GOOD
                    }
                    Err(e) => {
                        return Err(Status::InternalServerError);
                    }
                }
            }
        } else {
            println!("categories is null?")
        }
    }

    return Ok(Json(json!({
        "status": "success",
        "message": "Successfully updated."
    })))
}

// Export the routes
pub fn execution_routes() -> Vec<Route> {
    routes![execute_program, stop_process, add_application, update_application, remove_application, get_application, get_all_applications, add_category, delete_category, get_all_categories, ws_process_status, ws_process_count]
}