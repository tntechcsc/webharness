#[macro_use] extern crate rocket;
#[macro_use] extern crate bcrypt;
use rocket::http::Status;
use rocket::serde::{Serialize, Deserialize, json::Json}; // for handling jsons
use rocket::fs::{FileServer, NamedFile}; // for serving a file
use serde_json::json;
use std::path::PathBuf; // for accessing a folder
use rusqlite::{Connection, Result}; // for our sqlite connection
use std::sync::{Arc, Mutex}; // for thread-safe access
use utoipa::{OpenApi, ToSchema, IntoParams};
use utoipa_swagger_ui::SwaggerUi;
use bcrypt::{DEFAULT_COST, hash, verify};
use uuid::Uuid;
use std::process::Command;
use std::collections::HashMap;
use std::process::ExitStatus;
use rocket::State;
use winapi::um::processthreadsapi::OpenProcess;
use winapi::um::winnt::PROCESS_TERMINATE;
use winapi::um::processthreadsapi::TerminateProcess;
use chrono::{DateTime, Utc};

struct ProcessInfo {
    pid: u32,
    status: Arc<Mutex<String>>,           // e.g., "Running", "Exited"
    exit_code: Arc<Mutex<Option<i32>>>,   // Exit code if the process has exited
}

type ProcessMap = Arc<Mutex<HashMap<String, ProcessInfo>>>;

struct DB {
    conn: Mutex<Connection>, // rust complains if there is no thread safety with our connection
}

impl DB {
    fn new() -> Result<Self> {
        let conn = Connection::open("harnessDB.db")?; // ? is in the case of an error

        // Set the encryption key for SQLCipher
        // we will have to have this read from a environment variable in the future
        conn.execute_batch("PRAGMA key = 'my_secure_passphrase';")?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS User (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                pass_hash TEXT NOT NULL,
                email TEXT NOT NULL
            )",
            [],
        )?;
    
        // Create the Session table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS Session (
                id TEXT PRIMARY KEY,
                userId TEXT,
                startTime DATE,
                endTime DATE,
                FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE
            )",
            [],
        )?;
    
        // Create the Preferences table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS Preferences (
                userId TEXT PRIMARY KEY,
                theme TEXT,
                FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE
            )",
            [],
        )?;
    
        // Create the Roles table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS Roles (
                roleId INTEGER PRIMARY KEY,
                roleName TEXT,
                description TEXT
            )",
            [],
        )?;
    
        // Create the UserRoles table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS UserRoles (
                userId TEXT,
                roleId INTEGER,
                PRIMARY KEY (userId, roleId),
                FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
                FOREIGN KEY(roleId) REFERENCES Roles(roleId) ON DELETE CASCADE
            )",
            [],
        )?;
    
        // Create the Category table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS Category (
                id TEXT PRIMARY KEY,
                name TEXT,
                description TEXT
            )",
            [],
        )?;
    
        // Create the Instructions table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS Instructions (
                id TEXT PRIMARY KEY,
                path TEXT,
                arguments TEXT
            )",
            [],
        )?;
    
        // Create the Application table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS Application (
                id TEXT PRIMARY KEY,
                userId TEXT,
                name TEXT,
                description TEXT,
                category_id TEXT,
                FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
                FOREIGN KEY(category_id) REFERENCES Category(id) ON DELETE SET NULL
            )",
            [],
        )?;
    
        // Create the Process table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS Process (
                id TEXT,
                pid INTEGER,
                status TEXT,
                PRIMARY KEY(id),
                FOREIGN KEY(id) REFERENCES Application(id) ON DELETE CASCADE
            )",
            [],
        )?;

        Ok(DB { conn: Mutex::new(conn) })
    }
}

#[derive(Serialize, Deserialize, ToSchema)]
struct User {
    #[schema(example = "95dcd4e0-7e1f-4686-bc90-b010ff98213e")]
    id: String,
    #[schema(example = "gbus")]
    username: String,
    #[schema(example = "gbus@gbus.com")]
    email: String,
    #[schema(example = "$2b$12$mhH1Yx.SoK3Jhl.PJkvi1OpMY0GL6wh79K0MIRosiZrTXM2ThTpIq")] // obviously the front end is not expected to send a hashed password. 
    pass_hash: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
struct UserInit {
    #[schema(example = "gbus")]
    username: String,
    #[schema(example = "gbus@gmail.com")]
    email: String,
    #[schema(example = "password123")]
    password: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
struct Login {
    #[schema(example = "gbus")]
    username: String,
    #[schema(example = "gbus@gmail.com")]
    email: String,
    #[schema(example = "password123")]
    password: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
struct Session {
    #[schema(example = "ajhniksdjnkdsa-7e1f-4686-bc90-b010ff98213e")]
    id: String,
    #[schema(example = "95dcd4e0-7e1f-4686-bc90-b010ff98213e")]
    username: String,
    #[schema(example = "START TIME")]
    startTime: DateTime<Utc>,
    #[schema(example = "END TIME")]
    endTime: DateTime<Utc>,
}

fn user_exists(username: &String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> bool {
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM User WHERE username = ?1").unwrap(); // Prepare your query
    let mut result = stmt.query(&[&username]).unwrap(); // Execute the query
    let mut count = 0;
    if let Some(row) = result.next().unwrap() { // Unwrap the first row
        count = row.get(0).unwrap(); // Get the first column (COUNT(*) result)
    }
    if count >= 1 {
        return true;
    }
    else {
        return false;
    }
    /*
    match rows.next() { // Use match to handle the Option returned by next()
        Ok(Some(unwrapped_row)) => { // If there is a row
            let user_name: String = unwrapped_row.get(0).unwrap();
            let user_age: i32 = unwrapped_row.get(1).unwrap();
            return 201;
        }
        Ok(None) => { // If no rows were returned
            return 404;
        }
        Err(_) => { // Handle any potential errors from querying
            return 500;
        }
    }
    */
}

#[utoipa::path(
    get,
    path = "/api/user/search/{username}",
    tag = "User Management",
    responses(
        (status = 200, description = "User found"),
        (status = 404, description = "User not found")
    ),
    params(
        ("username", description = "A user's username")
    )
    )]
#[get("/api/user/search/<username>")]
fn user_search(username: String, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection

    let mut stmt = conn.prepare("SELECT username FROM User WHERE username = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query([&username]).unwrap(); // Execute the query
    
    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let found_username: String = unwrapped_row.get(0).unwrap();
            Ok(Json(json!({
                "status": "success",
                "message": format!("Found {}", found_username),
                "username": found_username
            })))
        }
        Ok(None) => {
            // No user found, return 404 Not Found
            Err(Status::NotFound)
        }
        Err(_) => {
            // Querying error, return 500 Internal Server Error
            Err(Status::InternalServerError)
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/user/register",
    tag = "User Management",
    responses(
        (status = 200, description = "Creates a user in our database")
    ),
    request_body = UserInit
    )]
#[post("/api/user/register", data = "<user_data>")]
fn user_register(user_data: Json<UserInit>, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection

    if user_exists(&user_data.username, &conn) {
        return Err(Status::BadRequest);
    }

    let id = Uuid::new_v4().to_string(); // Generate a unique user ID
    let pass_hash = hash(user_data.password.clone(), DEFAULT_COST).unwrap(); // Hash the password

    // Prepare the SQL INSERT query
    let query = "INSERT INTO User (id, username, pass_hash, email) VALUES (?1, ?2, ?3, ?4)";
    let result = conn.execute(query, &[&id, &user_data.username, &pass_hash, &user_data.email]);

    match result {
        Ok(_) => {
            // Successfully added user, return 200 OK with a success message
            Ok(Json(json!({
                "status": "success",
                "message": "User registered successfully",
                "user_id": id
            })))
        }
        Err(_) => {
            // Database error, return 400 Bad Request with error message
            Err(Status::BadRequest)
        }
    }
}


/*
Json(json!({
                "status": "success",
                "message": format!("Found {}", username)
            })) // Return the formatted message
*/
#[utoipa::path(
    post,
    path = "/api/user/login",
    tag = "User Management",
    responses(
        (status = 200, description = "Logs a user in")
    ),
    request_body = Login
    )]
#[post("/api/user/login", data = "<user_data>")]
fn user_login(user_data: Json<Login>, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection

    if user_exists(&user_data.username, &conn) == false {
        return Err(Status::NotFound)
    }

    // Prepare the SQL INSERT query
    let mut stmt = conn.prepare("SELECT pass_hash FROM User WHERE username = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query(&[&user_data.username]).unwrap(); // Execute the query

    match rows.next() { // Use match to handle the Option returned by next()
        Ok(Some(unwrapped_row)) => { // If there is a row
            let pass_hash: String = unwrapped_row.get(0).unwrap();
            Ok(Json(json!({
                "status": "success",
                "message": "User logged in",
                "pass_hash": pass_hash
            })))
        }
        Ok(None) => { // If no rows were returned
            Err(Status::NotFound)
        }
        Err(_) => { // Handle any potential errors from querying
            Err(Status::InternalServerError)
        }
    }
}

/*
#[utoipa::path(
    put,
    path = "/api/user/update",
    tag = "User Management",
    responses(
        (status = 200, description = "Updates user info"),
        (status = 404, description = "User not found")
    ),
    request_body = User
    )]
#[put("/api/user/update", data = "<user_data>")]
fn user_update(user_data: Json<UserInit>, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection

    let mut stmt = conn.prepare("SELECT username FROM User WHERE username = ?1").unwrap(); // Prepare the query
    let mut rows = stmt.query([&user_data.username]).unwrap(); // Execute the query

    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let found_username: String = unwrapped_row.get(0).unwrap();
            Ok(Json(json!({
                "status": "success",
                "message": format!("Found {}", found_username)
            })))
        }
        Ok(None) => {
            // No user found, return 404 Not Found
            Err(Status::NotFound)
        }
        Err(_) => {
            // Querying error, return 500 Internal Server Error
            Err(Status::InternalServerError)
        }
    }
}
*/

#[utoipa::path(
    delete,
    path = "/api/user/delete/{username}",
    tag = "User Management",
    responses(
        (status = 200, description = "Deletes a user"),
        (status = 404, description = "User not found")
    ),
    params(
        ("username", description = "name of person you want to delete")
    )
    )]
#[delete("/api/user/delete/<username>")]
fn user_delete(username: String, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection

    // Check if the user exists
    if !user_exists(&username, &conn) {
        return Err(Status::NotFound); // 404 Not Found if user doesn't exist
    }

    // Prepare the SQL DELETE query
    let query = "DELETE FROM User WHERE username = ?1";
    let result = conn.execute(query, &[&username]);

    match result {
        Ok(0) => {
            // If no rows were affected, return 404 Not Found
            Err(Status::NotFound)
        }
        Ok(_) => {
            // Successfully deleted the user, return 200 OK with a success message
            Ok(Json(json!({
                "status": "success",
                "message": "User deleted successfully"
            })))
        }
        Err(_) => {
            // Database error, return 500 Internal Server Error
            Err(Status::InternalServerError)
        }
    }
}

#[derive(Serialize, Deserialize, ToSchema)]
struct ExecuteRequest {
    #[schema(example = "/path/to/executable")]
    executable_path: String,
}

#[utoipa::path(
    post,
    path = "/api/execute",
    tag = "Program Execution",
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

#[derive(Serialize, ToSchema)]
struct ProcessStatusResponse {
    status: String,
    pid: u32,
    exit_code: Option<i32>,
}

#[utoipa::path(
    get,
    path = "/api/process/{process_id}/status",
    tag = "Program Execution",
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
    tag = "Program Execution",
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

#[launch]
fn rocket() -> _ {
    #[derive(OpenApi)]
    #[openapi(
        tags(
            (name = "User Management", description = "User management endpoints."),
            (name = "Program Execution", description = "Application endpoints."),
        ),
        paths(user_search, user_register, user_login, user_delete, execute_program, get_process_status, stop_process)
    )]
    pub struct ApiDoc;
    
    let db = Arc::new(DB::new().expect("Failed to initialize database")); // rust requires thread safety
    let process_map: ProcessMap = Arc::new(Mutex::new(HashMap::new()));

    rocket::build()
    .manage(db)
    .manage(process_map)
    .mount("/",
           SwaggerUi::new("/api/docs/swagger/<_..>").url("/api/docs/openapi.json", ApiDoc::openapi()),
    )
    .mount("/", routes![user_search, user_register, user_login, user_delete, execute_program, get_process_status, stop_process])
    .configure(rocket::Config {
        port: 3000,
        ..Default::default()
    })
}
