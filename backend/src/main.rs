#[macro_use] extern crate rocket;
#[macro_use] extern crate bcrypt;
use rocket::http::Status;
use rocket::serde::{Serialize, Deserialize, json::Json}; // for handling jsons
use rocket::fs::{FileServer, NamedFile}; // for serving a file
use serde_json::json;
use std::path::PathBuf; // for accessing a folder
use rusqlite::{Connection, Result, OptionalExtension}; // for our sqlite connection
use std::sync::{Arc, Mutex}; // for thread-safe access
use utoipa::{OpenApi, ToSchema, IntoParams};
use utoipa::openapi::security::{SecurityScheme, ApiKeyValue};
use utoipa::openapi::security::ApiKey as UtoipaApiKey;
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
use chrono::{DateTime, Utc, Duration, TimeDelta};
use rocket::request::{FromRequest, Outcome};

pub struct SessionGuard(String);

impl SessionGuard{
    fn is_valid_session(session_id: &str, conn: &Connection) -> bool {
        let now = Utc::now().to_string();
        
        match conn.query_row(
            "SELECT COUNT(*) FROM Session 
             WHERE id = ? 
             AND endTime > ?",
            &[session_id, &now],
            |row| row.get::<_, i64>(0)
        ) {
            Ok(count) => count > 0,
            Err(_) => false
        }
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for SessionGuard {
    type Error = ();

    async fn from_request(request: &'r rocket::Request<'_>) -> Outcome<Self, Self::Error> {
        let db = request.rocket().state::<Arc<DB>>().unwrap();
        let conn = db.conn.lock().unwrap();
        
        match request.headers().get_one("x-session-id") {
            None => Outcome::Error((Status::Unauthorized, ())),
            Some(session_id) if !Self::is_valid_session(session_id, &conn) => {
                Outcome::Error((Status::Unauthorized, ()))
            },
            Some(session_id) => Outcome::Success(SessionGuard(session_id.to_string())),
        }
    }
}

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

        let conn = Mutex::new(conn); // making the connection thread safe

        {
            let conn_use = conn.lock().unwrap(); // locking the connection to use it

            // Set the encryption key for SQLCipher
            // we will have to have this read from a environment variable in the future
            conn_use.execute_batch("PRAGMA key = 'my_secure_passphrase';")?;

            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS User (
                    id VARCHAR(36) PRIMARY KEY,
                    username VARCHAR(15) NOT NULL,
                    pass_hash VARCHAR(60) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    CHECK (length(id) <= 36),
                    CHECK (length(username) <= 15),
                    CHECK (length(pass_hash) <= 60),
                    CHECK (length(email) <= 100)
                )",
                [],
            )?;
        
            // Create the Session table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Session (
                    id VARCHAR(36) PRIMARY KEY,
                    userId VARCHAR(36),
                    startTime DATE,
                    endTime DATE,
                    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
                    CHECK (length(id) <= 36),
                    CHECK (length(userId) <= 36)         
                )",
                [],
            )?;
        
            // Create the Preferences table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Preferences (
                    userId VARCHAR(36) PRIMARY KEY,
                    theme VARCHAR(6),
                    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
                    CHECK (length(userId) <= 36),
                    CHECK (length(theme) <= 6)            
                )",
                [],
            )?;
        
            // Create the Roles table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Roles (
                    roleId VARCHAR(36) PRIMARY KEY,
                    roleName VARCHAR(36),
                    description TEXT,
                    CHECK (length(roleId) <= 36),
                    CHECK (length(roleName) <= 36)
                )",
                [],
            )?;
    
            // Check if the trigger already exists before creating it
            let mut stmt = conn_use.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = 'prevent_multiple_superadmins'")?;
            let trigger_exists: bool = stmt.query_row([], |row| row.get::<_, String>(0)).optional()?.is_some();
    
            // If the trigger doesn't exist, create it
            if !trigger_exists {
                conn_use.execute(
                    "
                    CREATE TRIGGER prevent_multiple_superadmins
                    BEFORE INSERT ON UserRoles
                    FOR EACH ROW
                    BEGIN
                        -- If the new roleId is 1, check if there's already one row with roleId 1
                        SELECT
                        CASE
                            WHEN (SELECT COUNT(*) FROM UserRoles WHERE roleId = 1) > 0
                            THEN
                                RAISE (ABORT, 'Only one user can have roleId 1')
                        END;
                    END;
                    ",
                    [],
                )?;
            }
        
            // Create the UserRoles table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS UserRoles (
                    userId VARCHAR(36),
                    roleId VARCHAR(36),
                    PRIMARY KEY (userId, roleId),
                    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
                    FOREIGN KEY(roleId) REFERENCES Roles(roleId) ON DELETE CASCADE,
                    CHECK (length(userId) <= 36),
                    CHECK (length(roleId) <= 36)
                )",
                [],
            )?;
        
            // Create the Category table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Category (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(36),
                    description TEXT,
                    CHECK (length(id) <= 36),
                    CHECK (length(name) <= 36)
                )",
                [],
            )?;
    
            // Create the Application table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Application (
                    id VARCHAR(36) PRIMARY KEY,
                    userId VARCHAR(36),
                    contact VARCHAR(100),
                    name VARCHAR(36),
                    description TEXT,
                    category_id VARCHAR(36),
                    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
                    FOREIGN KEY(category_id) REFERENCES Category(id) ON DELETE SET NULL,
                    CHECK (length(id) <= 36),
                    CHECK (length(userId) <= 36),
                    CHECK (length(contact) <= 100),
                    CHECK (length(name) <= 36),
                    CHECK (length(category_id) <= 36)
                )",
                [],
            )?;
        
            // Create the Instructions table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Instructions (
                    id VARCHAR(36) PRIMARY KEY,
                    path VARCHAR(256),
                    arguments VARCHAR(256),
                    CHECK (length(id) <= 36),
                    CHECK (length(id) <= 256),
                    CHECK (length(arguments) <= 256)
                )",
                [],
            )?;
        
            // Create the Process table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Process (
                    id VARCHAR(36),
                    pid INTEGER,
                    status VARCHAR(36),
                    PRIMARY KEY(id),
                    FOREIGN KEY(id) REFERENCES Application(id) ON DELETE CASCADE,
                    CHECK (length(id) <= 36),
                    CHECK (length(status) <= 36)
                )",
                [],
            )?;
    
            // Creating Superadmin, admin, and viewer roles
            conn_use.execute(
                "INSERT OR IGNORE INTO Roles (roleId, roleName, description) VALUES (?1, ?2, ?3)",
                &["1", "Superadmin", "A special admin that manages every single other user"],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Roles (roleId, roleName, description) VALUES (?1, ?2, ?3)",
                &["2", "Admin", "A admin that manages other users(Viewers)"],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Roles (roleId, roleName, description) VALUES (?1, ?2, ?3)",
                &["3", "Viewer", "A regular user that can only view and run programs"],
            )?;
        }

        Ok(DB { conn })
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
struct Logout {
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
    userId: String,
    #[schema(example = "START TIME")]
    startTime: String,
    #[schema(example = "END TIME")]
    endTime: String,
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

fn user_id_search(username: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> String {    
    let mut stmt = conn.prepare("SELECT id FROM User WHERE username = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query([&username]).unwrap(); // Execute the query
    
    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let found_id: String = unwrapped_row.get(0).unwrap();
            return found_id;
        }
        Ok(None) => {
            // No user found, return 404 Not Found
            return "".to_string();
        }
        Err(_) => {
            // Querying error, return 500 Internal Server Error
            return "".to_string();
        }
    }
}

fn user_role_search(username: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> String {    
    let userId = user_id_search(username, &conn);
    let mut stmt = conn.prepare("SELECT roleId FROM UserRoles WHERE userId = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query([&userId]).unwrap(); // Execute the query
    
    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let found_id: String = unwrapped_row.get(0).unwrap();
            return found_id;
        }
        Ok(None) => {
            // No user found, return 404 Not Found
            return "".to_string();
        }
        Err(_) => {
            // Querying error, return 500 Internal Server Error
            return "".to_string();
        }
    }
}

fn user_password_check(username: &String, password: &String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> bool {
    let mut stmt = conn.prepare("SELECT pass_hash FROM User WHERE username = ?1").unwrap();
    let mut rows = stmt.query(&[username]).unwrap();

    match rows.next() { // Use match to handle the Option returned by next()
        Ok(Some(unwrapped_row)) => { // If there is a row
            let pass_hash: String = unwrapped_row.get(0).unwrap();
            match verify(password, &pass_hash) {
                Ok(valid) => {
                    if valid {
                        return true;
                    } else {
                        return false;
                    }
                }
                Err(e) => {
                    return false;
                }
            }

        }
        Ok(None) => { // If no rows were returned
            return false;
        }
        Err(_) => { // Handle any potential errors from querying
            return false;
        }
    }
}

fn session_valid(userId: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> bool {
    let endTimeString: String;
    let endTime: DateTime<Utc>;
    let now: DateTime<Utc> = Utc::now();
    let delta: TimeDelta;
    let hour: TimeDelta = TimeDelta::hours(1);
    
    let mut stmt = conn.prepare("SELECT endTime FROM Session WHERE userId = ?1").unwrap();
    let mut result = stmt.query(&[&userId]).unwrap();

    match result.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            endTimeString = unwrapped_row.get(0).unwrap();
        }
        Ok(None) => {
            return false;
        }
        Err(_) => {
            // Querying error, return 500 Internal Server Error
            return false;
        }
    }

    endTime = endTimeString.parse().unwrap();
    delta = now - endTime; 
    if delta >= hour {
        return false
    }
    else {
        return true;
    }
}

fn has_excess_sessions(userId: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> bool {
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM Session WHERE userId = ?1").unwrap(); // Prepare your query
    let mut result = stmt.query(&[&userId]).unwrap(); // Execute the query
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

//function to delete every session for a given user id
fn delete_session(userId: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> () {
    let mut id: String; // the ids of the session we want to delete

    // preparing a statement to collect all session ids for the given user id
    let mut stmt = conn.prepare("SELECT id from Session WHERE userId = ?1").unwrap();
    let mut rows = stmt.query_map([&userId], |row| { //creating a query map with the expected rows of Session
        Ok(Session {
            id: row.get(0).expect("ERROR"), // we only need ids
            userId: "".to_string(),
            endTime: "".to_string(),
            startTime: "".to_string(),
            })
        }
    ).unwrap();

    let mut ids: Vec<String> = Vec::new(); // a vector to hold our ids
     
    for row in rows { // iterating through the query map
        let session = row.unwrap(); // unwrapping a session from the query map
        ids.push(session.id) // pushing it into the ids vector
    }

    for id in ids.iter_mut() { // iterating through the ids vector to delete every session with the session ids we collected
        let query = "DELETE FROM Session WHERE id = ?1"; // making a query to delete that session id
        let result = conn.execute(query, &[&id.to_string()]); // executing that query
    }

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
    ),
    security(
        ("session_id" = [])
    ),
    )]
#[get("/api/user/search/<username>")]
fn user_search(_session_id: SessionGuard, username: String, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection

    let mut stmt = conn.prepare("SELECT id FROM User WHERE username = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query([&username]).unwrap(); // Execute the query
    
    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let found_id: String = unwrapped_row.get(0).unwrap();
            Ok(Json(json!({
                "status": "success",
                "message": format!("Found {}", username),
                "id": found_id
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
    get,
    path = "/api/role/search/{username}",
    tag = "User Management",
    responses(
        (status = 200, description = "User found"),
        (status = 404, description = "User not found")
    ),
    params(
        ("username", description = "A user's username")
    ),
    security(
        ("session_id" = [])
    ),
    )]
#[get("/api/role/search/<username>")]
fn user_role_search_api(_session_id: SessionGuard, username: String, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection

    println!("{}", username);
    let userId = user_id_search(username.to_string(), &conn);
    println!("{}", userId);
    let mut stmt = conn.prepare("SELECT roleId FROM UserRoles WHERE userId = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query([&userId]).unwrap(); // Execute the query
    
    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let roleId: String = unwrapped_row.get(0).unwrap();
            Ok(Json(json!({
                "status": "success",
                "message": format!("Found roleId"),
                "roleId": roleId,
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
fn user_register(user_data: Json<UserInit>, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> { //should we also log them in?
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

#[utoipa::path(
    post,
    path = "/api/user/superadmin_register",
    tag = "User Management",
    responses(
        (status = 200, description = "Creates a superadmin in our database")
    ),
    request_body = UserInit
    )]
#[post("/api/user/superadmin_register", data = "<user_data>")]
fn superadmin_register(user_data: Json<UserInit>, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> { //should we also log them in?
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
            println!("GOOD")
        }
        Err(_) => {
            // Database error, return 400 Bad Request with error message
            return Err(Status::BadRequest);
        }
    }

    let query = "INSERT INTO UserRoles (userId, roleId) VALUES (?1, ?2)";
    let result = conn.execute(query, &[&id, "1"]);

    match result {
        Ok(_) => {
            Ok(Json(json!({
                "status": "success",
                "message": "User registered successfully",
                "user_id": id
            })))        }
        Err(_) => {
            // Database error, return 400 Bad Request with error message
            Err(Status::InternalServerError)
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
fn user_login(user_data: Json<Login>, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> { // endpoint to log in a person
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let id = Uuid::new_v4().to_string(); // Generate a session ID
    let mut userId: String; // we need to look for their userId as we only know their username
    let startTime: String = Utc::now().to_string(); // the time that the session starts UTC or greenwich time
    let endTime: String = (Utc::now() + Duration::hours(1)).to_string(); // the time that the session ends (1 hour from when the user was logged in)

    // checking if the user exists. we pass the username and connection via association
    if user_exists(&user_data.username, &conn) == false {
        return Err(Status::NotFound) // if they are not found we return a status error of not found
    }

    //checking their their password
    if !user_password_check(&user_data.username, &user_data.password, &conn) {
        return Err(Status::BadRequest) // bad request if the password doesnt match. idk if this is the best status response
    }

    //---getting user id to insert into session
    let mut stmt = conn.prepare("SELECT id FROM User WHERE username = ?1").unwrap(); //preparing a statement to query for their username
    let mut result = stmt.query(&[&user_data.username]).unwrap(); // also whats very important is that usernames are unique

    match result.next() { // a switch statement to find out their password
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            userId = unwrapped_row.get(0).unwrap();
        }
        Ok(None) => { // nothing was found in the database for some reason
            return Err(Status::BadRequest);
        }
        Err(_) => {
            // Querying error, return 500 Internal Server Error // any sort of errors
            return Err(Status::InternalServerError);
        }
    }

    //checking if the user's session is valid or if the user has too many sessions. assuming a user can only have one session
    if session_valid(userId.clone(), &conn) == false || has_excess_sessions(userId.clone(), &conn) {
        delete_session(userId.clone(), &conn); //deleting their sessions as we are about to create one for them
    }

    let query = "INSERT INTO Session (id, userId, startTime, endTime) VALUES (?1, ?2, ?3, ?4)"; // making a query to insert into the session table
    let result = conn.execute(query, &[&id, &userId, &startTime, &endTime]); // passing all the proper values

    match result { // switch statement
        Ok(_) => { // if its ok, then we return success
            // Successfully added user, return 200 OK with a success message
            Ok(Json(json!({
                "status": "success",
                "message": "User logged in successfully",
                "time": startTime,
                "session_id": id,
            })))
        }
        Err(_) => { // if it was not successful, then we return a status for a bad request. truly dont know if this is the proper response code though.
            // Database error, return 400 Bad Request with error message
            Err(Status::BadRequest)
        }
    }
    
}   

#[utoipa::path(
    delete,
    path = "/api/user/logout",
    tag = "User Management",
    responses(
        (status = 200, description = "User logged out"),
        (status = 404, description = "User not found")
    ),
    request_body = Logout
)]
#[delete("/api/user/logout", data = "<user_data>")]
fn user_logout(user_data: Json<Logout>, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let mut userId: String; // we need to look for their userId as we only know their username

    // checking if the user exists. we pass the username and connection via association
    if user_exists(&user_data.username, &conn) == false {
        return Err(Status::NotFound) // if they are not found we return a status error of not found
    }

    //checking their their password
    if !user_password_check(&user_data.username, &user_data.password, &conn) {
        return Err(Status::BadRequest) // bad request if the password doesnt match. idk if this is the best status response
    }

    //---getting user id to delete from session
    let mut stmt = conn.prepare("SELECT id FROM User WHERE username = ?1").unwrap(); //preparing a statement to query for their username
    let mut result = stmt.query(&[&user_data.username]).unwrap(); // also whats very important is that usernames are unique

    match result.next() { // a switch statement to find out their password
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            userId = unwrapped_row.get(0).unwrap();
        }
        Ok(None) => { // nothing was found in the database for some reason
            return Err(Status::BadRequest);
        }
        Err(_) => {
            // Querying error, return 500 Internal Server Error // any sort of errors
            return Err(Status::InternalServerError);
        }
    }

    //checking if the user's session is valid or if the user has too many sessions. assuming a user can only have one session
    if session_valid(userId.clone(), &conn) == false || has_excess_sessions(userId.clone(), &conn) {
        delete_session(userId.clone(), &conn); //deleting their sessions as we are about to create one for them
        return Ok(Json(json!({
            "status": "success",
            "message": format!("Successfully logged out {}", &user_data.username)
        })))
    }
    else {
        return Err(Status::BadRequest);
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

#[derive(Serialize, ToSchema)]
struct ProcessStatusResponse {
    status: String,
    pid: u32,
    exit_code: Option<i32>,
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

#[launch]
fn rocket() -> _ {
    #[derive(OpenApi)]
    #[openapi(
        tags(
            (name = "User Management", description = "User management endpoints."),
            (name = "Program Management", description = "Application endpoints."),
        ),
        paths(user_search, user_role_search_api, user_register, superadmin_register, user_login, user_delete, execute_program, get_process_status, stop_process, user_logout),
        modifiers(&SecurityAddon),
    )]
    pub struct ApiDoc;
    struct SecurityAddon;

    impl utoipa::Modify for SecurityAddon {
        fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
            if let Some(components) = openapi.components.as_mut() {
                components.add_security_scheme(
                    "session_id",
                    SecurityScheme::ApiKey(UtoipaApiKey::Header(ApiKeyValue::new("x-session-id")))
                );
            }
        }
    }
    
    let db = Arc::new(DB::new().expect("Failed to initialize database")); // rust requires thread safety
    let process_map: ProcessMap = Arc::new(Mutex::new(HashMap::new()));

    rocket::build()
    .manage(db)
    .manage(process_map)
    .mount("/",
           SwaggerUi::new("/api/docs/<_..>").url("/api/docs/openapi.json", ApiDoc::openapi()),
    )
    .mount("/", routes![user_search, user_role_search_api, user_register, superadmin_register, user_login, user_logout, user_delete, execute_program, get_process_status, stop_process])
    .configure(rocket::Config {
        port: 3000,
        ..Default::default()
    })
}
