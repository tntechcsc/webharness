//rocket stuff for backend
use rocket::http::Status; // to return a status code
use rocket::serde::{Serialize, Deserialize, json::Json}; // for handling jsons
use rocket::State; // for handling state???
use rocket::request::{FromRequest, Outcome}; //for outcome and optional handling
use rocket::Route;

//for jsons
use serde_json::json;
//for our db connection
use rusqlite::{Connection, Result, OptionalExtension, params_from_iter};
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

    // Validate the path
    let path = &application_data.executable_path;
    if !std::path::Path::new(path).exists() {
        return Err(Status::BadRequest);
    }
    let application_id = Uuid::new_v4().to_string();
    let instruction_id = Uuid::new_v4().to_string();

    let query = "INSERT INTO Application (id, userId, contact, name, description) VALUES (?1, ?2, ?3, ?4, ?5)";
    let result = conn.execute(
        query,
        params![
            &application_id,
            &application_data.user_id,
            "email@email.com", // TODO: figure out how to get iser contact info.
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

    let application: ApplicationDetails = match stmt.query_row([&application_id], |row| {
        Ok(ApplicationDetails {
            id: row.get(0)?,
            user_id: row.get(1)?,
            contact: row.get(2)?,
            name: row.get(3)?,
            description: row.get(4)?,
            category_ids: None, // Placeholder, will be updated below
        })
    }) {
        Ok(app) => app,
        Err(rusqlite::Error::QueryReturnedNoRows) => return Err(Status::NotFound),
        Err(e) => {
            error!("Database error while retrieving application: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    // Get category IDs for the application
    let query = "SELECT category_id FROM CategoryApplication WHERE application_id = ?";
    let mut stmt = match conn.prepare(query) {
        Ok(stmt) => stmt,
        Err(e) => {
            error!("Database error while preparing category query: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    let category_ids_result: Result<Vec<String>, _> = stmt
        .query_map([&application_id], |row| row.get(0))
        .and_then(|rows| rows.collect());

    let category_ids = match category_ids_result {
        Ok(ids) if !ids.is_empty() => Some(ids),
        _ => None, // No categories found
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
        "application": {
            "id": application.id,
            "user_id": application.user_id,
            "contact": application.contact,
            "name": application.name,
            "description": application.description,
            "category_ids": category_ids,  // Now returns multiple categories
        },
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
                category_ids: None, // Placeholder, will be updated
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
    let query = "SELECT application_id, category_id FROM CategoryApplication";
    let mut stmt = match conn.prepare(query) {
        Ok(stmt) => stmt,
        Err(e) => {
            error!("Database error while preparing category query: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    let mut category_map: HashMap<String, Vec<String>> = HashMap::new();

    let category_result = stmt.query_map([], |row| {
        let application_id: String = row.get(0)?;
        let category_id: String = row.get(1)?;
        Ok((application_id, category_id))
    });

    match category_result {
        Ok(rows) => {
            for row in rows {
                match row {
                    Ok((application_id, category_id)) => {
                        category_map.entry(application_id).or_default().push(category_id);
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
            app.category_ids = Some(category_map.remove(&app.id).unwrap_or_default());
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
#[patch("/api/application/update", data = "<application_data>")]
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

    let mut query: String = "UPDATE Application SET".to_string();
    
    let fields = [
        ("name", &application_data.name),
        ("description", &application_data.description),
        ("userId", &application_data.user_id),
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
    
    let fields = [
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
        Ok(0) => Err(Status::NotFound),
        Ok(_) => {
            Ok(Json(json!({
                "status": "success"
            })))
        }//moveon to update instructions}
        Err(e) => {
            eprintln!("Database error: {:?}", e);  // <-- Add this to log errors
            Err(Status::InternalServerError)
        }
    }
}

// Export the routes
pub fn execution_routes() -> Vec<Route> {
    routes![execute_program, get_process_status, stop_process, add_application, update_application, remove_application, get_application, get_all_applications, add_category, delete_category, get_all_categories]
}