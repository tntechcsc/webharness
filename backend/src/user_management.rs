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


#[utoipa::path(
    get,
    path = "/api/user/search/all",
    tag = "User Management",
    responses(
        (status = 200, description = "Users retrieved"),
        (status = 400, description = "Bad Request")
    ),
    security(
        ("session_id" = [])
    ),
)]
#[get("/api/user/search/all")]
fn user_all(_session_id: SessionGuard, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let session_id = _session_id.0; //getting their session id
    //checking their role
    let actor = session_to_user(session_id, &conn); // going from session to user_id
    if actor == "" {
        return Err(Status::BadRequest);
    }
    let actor = user_name_search(actor, &conn); // going from session to username for user_role_search
    if actor == "" {
        return Err(Status::BadRequest);
    }
    let actor_role = user_role_search(actor.clone(), &conn); //going from username to rolename
    if actor_role == "" {
        return Err(Status::BadRequest);
    }
    let actor_role: i32 = actor_role.parse().expect("Not a valid number"); //going from rolename to role_id holy s*** this is a lot of work
    if actor_role == 3 {// they are a view
        return Err(Status::Unauthorized);
    }

    let mut stmt = conn.prepare("SELECT U.id, U.username, U.email, R.roleName FROM User U JOIN UserRoles UR ON U.id = UR.userID JOIN Roles R ON UR.roleID = R.roleID;").unwrap(); // Prepare your query
    let mut rows = stmt.query([]).unwrap(); // Execute the query with no parameters

    let mut users = Vec::new(); // A vector to hold the results

    // Iterate over all rows and collect the results
    while let Some(unwrapped_row) = rows.next().unwrap() {
        let id: String = unwrapped_row.get(0).unwrap();
        let username: String = unwrapped_row.get(1).unwrap();
        let email: String = unwrapped_row.get(2).unwrap();
        let roleName: String = unwrapped_row.get(3).unwrap();

        // Push each result into the vector
        users.push(json!({
            "id": id,
            "username": username,
            "email": email,
            "roleName": roleName,
        }));
    }

    if users.is_empty() {
        // If no users are found, return a 404 Not Found
        Err(Status::NotFound)
    } else {
        // Return all the users as a JSON array
        Ok(Json(json!({
            "status": "success",
            "message": "Users retrieved",
            "users": users,
        })))
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

    let mut stmt = conn.prepare("SELECT id, username, email FROM User WHERE username = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query([&username]).unwrap(); // Execute the query
    
    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let id: String = unwrapped_row.get(0).unwrap();
            let username: String = unwrapped_row.get(1).unwrap();
            let email: String = unwrapped_row.get(2).unwrap();
            let roleId: String = user_role_search(username.clone(), &conn);
            let roleName: String = roleId_to_roleName(roleId.clone(), &conn);

            Ok(Json(json!({
                "status": "success",
                "message": format!("Found {}", username),
                "id": id,
                "username": username,
                "email": email,
                "roleId": roleId,
                "roleName": roleName,
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
    path = "/api/user/info",
    tag = "User Management",
    responses(
        (status = 200, description = "User found"),
        (status = 404, description = "User not found")
    ),
    params(),
    security(
        ("session_id" = [])
    ),
    )]
#[get("/api/user/info")]
fn user_info(_session_id: SessionGuard, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let session_id = _session_id.0;

    let id = session_to_user(session_id, &conn);

    let mut stmt = conn.prepare("SELECT id, username, email FROM User WHERE id = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query([&id]).unwrap(); // Execute the query
    
    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let id: String = unwrapped_row.get(0).unwrap();
            let username: String = unwrapped_row.get(1).unwrap();
            let email: String = unwrapped_row.get(2).unwrap();
            let roleId: String = user_role_search(username.clone(), &conn);
            let roleName: String = roleId_to_roleName(roleId.clone(), &conn);

            Ok(Json(json!({
                "status": "success",
                "message": format!("Found {}", username),
                "id": id,
                "username": username,
                "email": email,
                "roleId": roleId,
                "roleName": roleName,
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
    path = "/api/session-validate",
    tag = "User Management",
    responses(
        (status = 200, description = "Session is valid"),
        (status = 440, description = "Invalid Session")
    ),
    params(
    ),
    security(
        ("session_id" = [])
    ),
    )]
#[get("/api/session-validate")]
fn session_validate_api(_session_id: SessionGuard) -> Result<Json<serde_json::Value>, Status> {
    Ok(Json(json!({
        "status": "success",
        "message": "Session is valid"
    })))
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
    request_body = UserInit,
    security(
        ("session_id" = [])
    ),
    )]
#[post("/api/user/register", data = "<user_data>")]
fn user_register(_session_id: SessionGuard, user_data: Json<UserInit>, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> { //should we also log them in?
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    
    let actor = session_to_user(_session_id.0.clone(), &conn);
    let actor = user_name_search(actor, &conn);
    let actor_role = user_role_search(actor.clone(), &conn);
    let actor_role: i32 = actor_role.parse().expect("Not a valid number");
    let target_role: i32 = user_data.role.parse().expect("Not a valid number");
    let password = generate_passphrase();

    if actor == "" {
        return Err(Status::BadRequest);
    }
    
    if actor_role == 3 { // if they are a viewer
        return Err(Status::Unauthorized);
    }

    if actor_role > target_role {
        return Err(Status::Unauthorized);
    }

    if user_data.role == "1" {
        return Err(Status::Unauthorized);
    }

    if user_exists(&user_data.username, &conn) {
        return Err(Status::BadRequest);
    }

    let id = Uuid::new_v4().to_string(); // Generate a unique user ID
    let pass_hash = hash(password.clone(), DEFAULT_COST).unwrap(); // Hash the password

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
    let result = conn.execute(query, &[&id, &user_data.role]);
    match result {
        Ok(_) => {
            Ok(Json(json!({
                "status": "success",
                "message": "User registered successfully",
                "password": password.clone(),
                "username": user_data.username.clone(),
                "user_id": id
            })))
        }
        Err(_) => {
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
            return Err(Status::InternalServerError); // Return 500 for any database errors
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
            let log_data = json!({
                "username": user_data.username,
            });
    
            if let Err(e) = insert_system_log("Login", &log_data, &conn) {
                eprintln!("Failed to log user login: {}", e);
            }
    
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
    security(
        ("session_id" = [])
    ),
)]
#[delete("/api/user/logout")]
fn user_logout(_session_id: SessionGuard, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let mut userId: String = session_to_user(_session_id.0.clone(), &conn); // getting the user id from the session id
    let mut username: String = user_name_search(userId.clone(), &conn); // getting the username from the user id

    // checking if the user exists. we pass the username and connection via association
    if user_exists(&username, &conn) == false {
        return Err(Status::NotFound) // if they are not found we return a status error of not found
    }

    //checking if the user's session is valid or if the user has too many sessions. assuming a user can only have one session
    if session_valid(userId.clone(), &conn) == false || has_excess_sessions(userId.clone(), &conn) {
        delete_session(userId.clone(), &conn); //deleting their sessions as we are about to create one for them
        return Ok(Json(json!({
            "status": "success",
            "message": format!("Successfully logged out {}", &username)
        })))
    }
    else {
        return Err(Status::BadRequest);
    }
}



#[utoipa::path(
    put,
    path = "/api/password/reset",
    tag = "User Management",
    responses(
        (status = 200, description = "Updates user info"),
        (status = 404, description = "User not found")
    ),
    request_body = ModifyUserForm,
    security(
        ("session_id" = [])
    ),
    )]
#[put("/api/password/reset", data = "<user_data>")]
fn reset_password(_session_id: SessionGuard, user_data: Json<ModifyUserForm>, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let target = &user_data.target;
    let session_id = &_session_id.0;
    let mut password = generate_passphrase(); // Generate a new password

    if !user_exists(target, &conn) {
        return Err(Status::NotFound);
    }
    
    let pass_hash = hash(password.clone(), DEFAULT_COST).unwrap(); // Hash the password

    //session is that of the actor
    let actor = session_to_user(session_id.clone(), &conn);
    let actor = user_name_search(actor, &conn);

    if actor == "" {
        return Err(Status::NotFound);
    }

    if &actor == target { //cannot reset own password like this
        return Err(Status::BadRequest);
    }

    else if !compare_roles(actor, target.clone(), &conn) {
        return Err(Status::Unauthorized);
    }

    let query = "UPDATE User SET pass_hash = ?1 WHERE username = ?2";
    let result = conn.execute(query, &[&pass_hash, &target]);

    match result {
        Ok(0) => {
            // If no rows were affected, return 404 Not Found
            Err(Status::NotFound)
        }
        Ok(_) => {
            // Successfully updated the user, return 200 OK with a success message
            Ok(Json(json!({
                "status": "success",
                "message": "Password updated successfully",
                "password": password.clone(),
            })))
        }
        Err(_) => {
            // Database error, return 500 Internal Server Error
            Err(Status::InternalServerError)
        }
    }

}

#[utoipa::path(
    put,
    path = "/api/user/set-password",
    tag = "User Management",
    responses(
        (status = 200, description = "Password updated successfully"),
        (status = 400, description = "Invalid password format"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal Server Error")
    ),
    request_body = SetPasswordForm,
    security(
        ("session_id" = [])
    ),
)]
#[put("/api/user/set-password", data = "<password_data>")]
fn set_password(
    session: SessionGuard,
    password_data: Json<SetPasswordForm>,
    db: &rocket::State<Arc<DB>>
) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let session_id = &session.0;
    let new_password = &password_data.new_password;

    // Validate password format
    if !validate_password(new_password) {
        return Err(Status::BadRequest);
    }

    // Retrieve the user from session. This should ensure they can only update their own password
    let user_id = session_to_user(session_id.clone(), &conn);
    if user_id.is_empty() {
        return Err(Status::Unauthorized);
    }

    let pass_hash = hash(new_password, DEFAULT_COST).unwrap(); // Hash

    let query = "UPDATE User SET pass_hash = ?1 WHERE id = ?2";
    let result = conn.execute(query, &[&pass_hash, &user_id]);

    match result {
        Ok(0) => {
            Err(Status::NotFound)
        }
        Ok(_) => {
            Ok(Json(json!({ "status": "success", "message": "Password updated successfully" })))
        }
        Err(e) => {
            Err(Status::InternalServerError)
        }
    }
}

#[utoipa::path(
    delete,
    path = "/api/user/delete",
    tag = "User Management",
    responses(
        (status = 200, description = "Deletes a user"),
        (status = 404, description = "User not found")
    ),
    request_body = ModifyUserForm,
    security(
        ("session_id" = [])
    )
    )]
#[delete("/api/user/delete", data = "<deleteForm>")]
fn user_delete(_session_id: SessionGuard, deleteForm: Json<ModifyUserForm>, db: &rocket::State<Arc<DB>>) -> Result<Json<serde_json::Value>, Status> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let target = &deleteForm.target;
    let session_id = &_session_id.0;

    // Check if the user exists
    if !user_exists(&target, &conn) {
        println!("su not found for some reason too");
        return Err(Status::NotFound); // 404 Not Found if user doesn't exist
    }

    //session is that of the actor
    let actor = session_to_user(session_id.clone(), &conn);
    let actor = user_name_search(actor, &conn);
    let actor_role = user_role_search(actor.clone(), &conn);
    let target_role = user_role_search(target.clone(), &conn);

    if actor == "" {
        return Err(Status::NotFound);
    }
    if target_role == "1" { //cannot delete superadmin
        return Err(Status::NotFound);
    }
    if actor_role == "3" { //if they are a viewer
        return Err(Status::Unauthorized);
    }
    if &actor == target { //cannot delete yourself like this, honestly shouldnt be able to delete yourself at all
        return Err(Status::BadRequest);
    }

    else if !compare_roles(actor, target.clone(), &conn) {
        return Err(Status::Unauthorized);
    }

    // Prepare the SQL DELETE query
    let query = "DELETE FROM User WHERE username = ?1";
    let result = conn.execute(query, &[&target]);

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


// Export the routes
pub fn user_management_routes() -> Vec<Route> {
    routes![session_validate_api, user_all, user_search, user_info, user_role_search_api, user_register, user_login, user_logout, reset_password, set_password, user_delete]
}

pub struct UserSearchPaths;

impl UserSearchPaths {
    pub fn paths() -> Vec<&'static str> {
        vec!["/api/user/search"]
    }
}