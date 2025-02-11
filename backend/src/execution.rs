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

use rocket::info;

pub type ProcessMap = Arc<Mutex<HashMap<String, ProcessInfo>>>;

#[utoipa::path(
    post,
    path = "/api/execute",
    tag = "Program Management",
    responses(
        (status = 200, description = "Executable launched successfully"),
        (status = 400, description = "Invalid executable path"),
        (status = 500, description = "Failed to launch executable")
    ),
    request_body = ExecuteRequest
)]
#[post("/api/execute", data = "<request>")]
fn execute_program(
    request: Json<ExecuteRequest>,
    process_map: &State<ProcessMap>,
) -> Result<Json<serde_json::Value>, Status> {
    let path = &request.executable_path;

    // Validate the path
    if !std::path::Path::new(path).exists() {
        return Err(Status::BadRequest);
    }

    // Attempt to execute the program
    match Command::new(path).spawn() {
        Ok(mut child) => {
            let pid = child.id();
            let process_id = Uuid::new_v4().to_string();

            let status = Arc::new(Mutex::new("Running".to_string()));
            let exit_code = Arc::new(Mutex::new(None));

            let process_info = ProcessInfo {
                pid,
                status: status.clone(),
                exit_code: exit_code.clone(),
            };

            // Store the process info in the process map
            {
                let mut map = process_map.lock().unwrap();
                map.insert(process_id.clone(), process_info);
            }

            // Spawn a thread to monitor the process
            let process_map_clone = (*process_map).clone();
            let process_id_clone = process_id.clone();
            std::thread::spawn(move || {
                std::thread::spawn(move || {
                    loop {
                        match child.try_wait() {
                            Ok(Some(exit_status)) => {
                                // Process has exited
                                let mut map = process_map_clone.lock().unwrap();
                                if let Some(process_info) = map.get_mut(&process_id_clone) {
                                    *process_info.status.lock().unwrap() = "Exited".to_string();
                                    *process_info.exit_code.lock().unwrap() = exit_status.code();
                                }
                                break; // Exit the loop
                            }
                            Ok(None) => {
                                // Process is still running, sleep for a short duration
                                std::thread::sleep(std::time::Duration::from_millis(500));
                            }
                            Err(e) => {
                                eprintln!("Error monitoring process: {}", e);
                                break; // Exit the loop on error
                            }
                        }
                    }
                });                
            });

            Ok(Json(json!({
                "status": "success",
                "message": "Executable launched successfully",
                "process_id": process_id,
                "pid": pid,
                "path": path
            })))
        }
        Err(e) => {
            eprintln!("Failed to launch executable: {}", e);
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
    path = "/api/process/{process_id}/stop",
    tag = "Program Management",
    params(
        ("process_id" = String, Path, description = "Process ID to stop"),
    ),
    responses(
        (status = 200, description = "Process stopped successfully"),
        (status = 404, description = "Process not found"),
        (status = 500, description = "Failed to stop process"),
    ),
)]
#[delete("/api/process/<process_id>/stop")]
fn stop_process(
    process_id: String,
    process_map: &State<ProcessMap>,
) -> Result<Json<serde_json::Value>, Status> {
    let mut map = process_map.lock().unwrap();
    if let Some(process_info) = map.get(&process_id) {
        let pid = process_info.pid;

        // Attempt to terminate the process
        unsafe {
            let handle = OpenProcess(PROCESS_TERMINATE, 0, pid);
            if handle.is_null() {
                return Err(Status::InternalServerError); // Could not open process handle
            }

            // Terminate the process
            if TerminateProcess(handle, 1) == 0 {
                return Err(Status::InternalServerError); // Termination failed
            }
        }

        // Update the status in the process map
        *process_info.status.lock().unwrap() = "Stopped".to_string();
        Ok(Json(json!({
            "status": "success",
            "message": format!("Process with PID {} stopped successfully", pid)
        })))
    } else {
        Err(Status::NotFound) // Process ID not found in the map
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
    request_body = ApplicationEntry
)]
#[post("/api/applications/add", data = "<application_data>")]
fn add_application(
    _session_id: SessionGuard, // User session verification
    application_data: Json<ApplicationEntry>,
    db: &rocket::State<Arc<DB>>,
) -> Result<Json<serde_json::Value>, Status> {
    info!("Received Session ID: {:?}", _session_id.0);
    let conn = db.conn.lock().unwrap();

    // Validate user permissions
    let actor = session_to_user(_session_id.0.clone(), &conn);
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

    // Insert into Application table
    let query = "INSERT INTO Application (id, userId, contact, name, description, category_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)";
    let result = conn.execute(
        query,
        &[
            &application_id,
            &application_data.user_id,
            "email@email.com", // Placeholder contact info (should be retrieved from the user)
            &application_data.name,
            &application_data.description,
            &application_data.category_id.clone().unwrap_or("".to_string()),
        ],
    );

    if let Err(_) = result {
        return Err(Status::InternalServerError);
    }

    // Insert into Instructions table
    let query = "INSERT INTO Instructions (id, path, arguments) VALUES (?1, ?2, ?3)";
    let result = conn.execute(
        query,
        &[
            &instruction_id,
            &application_data.executable_path,
            &application_data.arguments.clone().unwrap_or("".to_string()),
        ],
    );

    if let Err(_) = result {
        return Err(Status::InternalServerError);
    }

    Ok(Json(json!({
        "status": "success",
        "message": "Application added successfully",
        "application_id": application_id,
        "instruction_id": instruction_id
    })))
}

// Export the routes
pub fn execution_routes() -> Vec<Route> {
    routes![execute_program, get_process_status, stop_process, add_application]
}