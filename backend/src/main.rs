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

struct DB {
    conn: Mutex<Connection>, // rust complains if there is no thread safety with our connection
}

impl DB {
    fn new() -> Result<Self> {
        let conn = Connection::open("db/harnessDB.db")?; // ? is in the case of an error
        Ok(DB { conn: Mutex::new(conn) })
    }
}

#[derive(Serialize, Deserialize, ToSchema)]
struct Message {
    #[schema(example = "Hello World")]
    message: String,
}

#[derive(Serialize, Deserialize, ToSchema, IntoParams)]
struct InputData {
    #[schema(example = "Tim")]
	name: String,
    #[schema(example = "21")]
	age: u32,
}

#[derive(Serialize, Deserialize, ToSchema)]
struct Person {
    name: String,
    age: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
struct User {
    #[schema(example = "95dcd4e0-7e1f-4686-bc90-b010ff98213e")]
    id: String,
    #[schema(example = "gbus")]
    username: String,
    #[schema(example = "$2b$12$mhH1Yx.SoK3Jhl.PJkvi1OpMY0GL6wh79K0MIRosiZrTXM2ThTpIq")] // obviously the front end is not expected to send a hashed password. 
    pass_hash: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
struct UserInit {
    #[schema(example = "gbus")]
    username: String,
    #[schema(example = "password123")]
    password: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
struct Login {
    #[schema(example = "gbus")]
    username: String,
    #[schema(example = "password123")]
    password: String,
}

fn user_exists(username: &String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> bool {
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM Users WHERE username = ?1").unwrap(); // Prepare your query
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

    let mut stmt = conn.prepare("SELECT username FROM users WHERE username = ?1").unwrap(); // Prepare your query
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
    let query = "INSERT INTO users (id, username, pass_hash) VALUES (?1, ?2, ?3)";
    let result = conn.execute(query, &[&id, &user_data.username, &pass_hash]);

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
    let mut stmt = conn.prepare("SELECT pass_hash FROM Users WHERE username = ?1").unwrap(); // Prepare your query
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

    let mut stmt = conn.prepare("SELECT username FROM users WHERE username = ?1").unwrap(); // Prepare the query
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
    let query = "DELETE FROM users WHERE username = ?1";
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
fn execute_program(request: Json<ExecuteRequest>) -> Result<Json<serde_json::Value>, Status> {
    let path = &request.executable_path;

    // Validate the path
    if !std::path::Path::new(path).exists() {
        return Err(Status::BadRequest);
    }

    // Attempt to execute the program
    match Command::new(path).spawn() {
        Ok(_) => Ok(Json(json!({
            "status": "success",
            "message": "Executable launched successfully",
            "path": path
        }))),
        Err(e) => {
            eprintln!("Failed to launch executable: {}", e);
            Err(Status::InternalServerError)
        }
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
        paths(user_search, user_register, user_login, user_update, user_delete, execute_program)
    )]
    pub struct ApiDoc;
    
    let db = Arc::new(DB::new().expect("Failed to initialize database")); // rust requires thread safety

    rocket::build()
    .manage(db)
    .mount("/",
           SwaggerUi::new("/api/docs/swagger/<_..>").url("/api/docs/openapi.json", ApiDoc::openapi()),
    )
    .mount("/", routes![user_search, user_register, user_login, user_update, user_delete, execute_program])
    .configure(rocket::Config {
        port: 3000,
        ..Default::default()
    })
}
