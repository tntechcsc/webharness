//rocket stuff for backend
use rocket::http::Status; // to return a status code
use rocket::serde::{Serialize, Deserialize, json::Json}; // for handling jsons
use rocket::State; // for handling state???
use rocket::request::{FromRequest, Outcome}; //for outcome and optional handling
use rocket::Route;

//for jsons
use serde_json::json;
//for our db connection
use rusqlite::{Connection, Result, OptionalExtension};
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

pub type ProcessMap = Arc<Mutex<HashMap<String, ProcessInfo>>>;

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
    db: &rocket::State<Arc<DB>>,
) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap();

    // Get the path from the database using application_id
    let query = "SELECT path FROM Instructions WHERE application_id = ?";
    let path: Result<String, _> = conn.query_row(query, [&request.application_id], |row| row.get(0));

    let path = match path {
        Ok(p) => p,
        Err(_) => {
            error!("No executable path found for application_id: {}", request.application_id);
            return Err(Status::BadRequest);
        }
    };

    if !std::path::Path::new(&path).exists() {
        error!("Executable path does not exist: {}", path);
        return Err(Status::BadRequest);
    }

    // Attempt to execute the program
    match Command::new(&path).spawn() {
        Ok(mut child) => {
            let pid = child.id();

            let status = Arc::new(Mutex::new("Running".to_string()));
            let exit_code = Arc::new(Mutex::new(None));

            let process_info = ProcessInfo {
                pid,
                status: status.clone(),
                exit_code: exit_code.clone(),
            };

            // Store in `process_map` using `application_id` as the key
            let mut map = process_map.lock().unwrap();
            map.insert(request.application_id.clone(), process_info);

            // Monitor the process in a separate thread so we can continue
            let process_map_clone = Arc::clone(process_map);
            let application_id_clone = request.application_id.clone();
            std::thread::spawn(move || {
                loop {
                    match child.try_wait() {
                        Ok(Some(exit_status)) => {
                            // Process has exited
                            let mut map = process_map_clone.lock().unwrap();
                            if let Some(process_info) = map.get_mut(&application_id_clone) {
                                *process_info.status.lock().unwrap() = "Exited".to_string();
                                *process_info.exit_code.lock().unwrap() = exit_status.code();
                            }
                            break;
                        }
                        Ok(None) => {
                            // Process is still running so take a nap
                            std::thread::sleep(std::time::Duration::from_secs(1));
                        }
                        Err(e) => {
                            error!("Error monitoring process: {}", e);
                            break;
                        }
                    }
                }
            });

            Ok(Json(json!({
                "status": "success",
                "message": "Executable launched successfully",
                "pid": pid,
                "application_id": request.application_id
            })))
        }
        Err(e) => {
            error!("Failed to launch executable: {}", e);
            Err(Status::InternalServerError)
        }
    }
}

#[utoipa::path(
    get,
    path = "/api/process/{process_id}/status",
    tag = "Program Management",
    params(
        ("process_id" = String, Path, description = "Process ID to query"),
    ),
    responses(
        (status = 200, description = "Process status retrieved successfully", body = ProcessStatusResponse),
        (status = 404, description = "Process not found"),
    ),
)]
#[get("/api/process/<process_id>/status")]
fn get_process_status(
    process_id: String,
    process_map: &State<ProcessMap>,
) -> Result<Json<ProcessStatusResponse>, Status> {
    let map = process_map.lock().unwrap();
    if let Some(process_info) = map.get(&process_id) {
        let status = process_info.status.lock().unwrap().clone();
        let pid = process_info.pid;
        let exit_code = *process_info.exit_code.lock().unwrap();
        Ok(Json(ProcessStatusResponse { status, pid, exit_code }))
    } else {
        Err(Status::NotFound)
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
#[delete("/api/process/<application_id>/stop")]
fn stop_process(
    _session_id: SessionGuard,  //Requires authentication
    application_id: String,
    process_map: &State<ProcessMap>,
) -> Result<Json<serde_json::Value>, Status> {
    let mut map = process_map.lock().unwrap();

    if let Some(process_info) = map.get(&application_id) {
        let parent_pid = process_info.pid;

        // Find all child processes
        let output = Command::new("wmic")
            .args(&["process", "where", format!("ParentProcessId={}", parent_pid).as_str(), "get", "ProcessId"])
            .output();

        let child_pids: Vec<String> = if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            stdout
                .lines()
                .skip(1) // Skip header line
                .filter_map(|line| {
                    let trimmed = line.trim();
                    if !trimmed.is_empty() {
                        Some(trimmed.to_string())
                    } else {
                        None
                    }
                })
                .collect()
        } else {
            vec![]
        };

        // Kill all child processes
        for pid in &child_pids {
            let _ = Command::new("taskkill")
                .args(&["/PID", pid, "/F"])
                .output();
        }

        // Kill the parent process
        let kill_result = Command::new("taskkill")
            .args(&["/PID", &parent_pid.to_string(), "/F"])
            .output();

        if let Err(e) = kill_result {
            error!("Failed to terminate parent process {}: {:?}", parent_pid, e);
            return Err(Status::InternalServerError);
        }

        // Update process status
        *process_info.status.lock().unwrap() = "Stopped".to_string();

        // Remove from process_map
        map.remove(&application_id);

        Ok(Json(json!({
            "status": "success",
            "message": format!("Process {} and all child processes stopped successfully", application_id)
        })))
    } else {
        error!("Process not found for application_id: {}", application_id);
        Err(Status::NotFound)
    }
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
    let path = &application_data.executable_path;

    // Validate the executable path
    if !std::path::Path::new(path).exists() {
        return Err(Status::BadRequest);
    }
    let application_id = Uuid::new_v4().to_string();
    let instruction_id = Uuid::new_v4().to_string();

    let query = "INSERT INTO Application (id, userId, contact, name, description, category_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)";
    let result = conn.execute(
        query,
        params![
            &application_id,
            &application_data.user_id,
            "email@email.com",
            &application_data.name,
            &application_data.description,
            application_data.category_id.as_deref(), //This converts `Option<&String>` to `Option<&str> which allows for requests without category id.`
        ],
    );

    if let Err(e) = result {
        error!("Database error while inserting application: {:?}", e);
        return Err(Status::InternalServerError);
    }

    // Insert into Instructions table
    let query = "INSERT INTO Instructions (id, application_id, path, arguments) VALUES (?1, ?2, ?3, ?4)";
    let result = conn.execute(
        query,
        &[
            &instruction_id,
            &application_id,
            &application_data.executable_path,
            &application_data.arguments.clone().unwrap_or("".to_string()),
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

    // Validate user permissions
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

    // Delete the application
    let query = "DELETE FROM Application WHERE id = ?1";
    let result = conn.execute(query, &[&application_id]);

    if let Err(e) = result {
        error!("Database error while deleting application: {:?}", e);
        return Err(Status::InternalServerError);
    }

    // Delete the related instructions (wasnt sure about how the cascades work so adding this just in case)
    let query = "DELETE FROM Instructions WHERE id = ?1";
    let result = conn.execute(query, &[&application_id]);

    if let Err(e) = result {
        error!("Database error while deleting instructions: {:?}", e);
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

    // Query to get application details
    let query = "SELECT id, userId, contact, name, description, category_id FROM Application WHERE id = ?1";
    let mut stmt = match conn.prepare(query) {
        Ok(stmt) => stmt,
        Err(e) => {
            error!("Database error while preparing application query: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    let application: ApplicationDetails = match stmt.query_row([&application_id], |row| {
        Ok(ApplicationDetails {
            id: row.get(0)?,
            user_id: row.get(1)?,
            contact: row.get(2)?,
            name: row.get(3)?,
            description: row.get(4)?,
            category_id: row.get(5).ok(), // category_id is optional
        })
    }) {
        Ok(app) => app,
        Err(rusqlite::Error::QueryReturnedNoRows) => return Err(Status::NotFound),
        Err(e) => {
            error!("Database error while retrieving application: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    // Query to get associated instructions
    let query = "SELECT path, arguments FROM Instructions WHERE application_id = ?1";
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

// Export the routes
pub fn execution_routes() -> Vec<Route> {
    routes![execute_program, get_process_status, stop_process, add_application, remove_application, get_application]
}