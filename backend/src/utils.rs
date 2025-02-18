//rocket stuff for backend
use rocket::http::Status; // to return a status code
use rocket::serde::{Serialize, Deserialize, json::Json}; // for handling jsons
use rocket::State; // for handling state???
use rocket::request::{FromRequest, Outcome}; //for outcome and optional handling

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
use crate::models::*;

pub fn user_exists(username: &String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> bool {
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

pub fn user_id_search(username: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> String {    
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

pub fn user_name_search(userId: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> String {    
    let mut stmt = conn.prepare("SELECT username FROM User WHERE id = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query([&userId]).unwrap(); // Execute the query
    
    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let found_name: String = unwrapped_row.get(0).unwrap();
            return found_name;
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

pub fn user_role_search(username: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> String {    
    let userId = user_id_search(username, &conn);
    let mut stmt = conn.prepare("SELECT roleId FROM UserRoles WHERE userId = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query([&userId]).unwrap(); // Execute the query
    
    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let found_id: String = unwrapped_row.get(0).unwrap();
            return found_id;
            println!("{}", found_id);
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

pub fn roleId_to_roleName(id: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> String {
    let mut stmt = conn.prepare("SELECT roleName FROM Roles WHERE roleId = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query([&id]).unwrap(); // Execute the query
    
    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let roleName: String = unwrapped_row.get(0).unwrap();
            return roleName;
            println!("{}", roleName);
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

pub fn has_role(username: String, role: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> bool {
    let user_role = user_role_search(username, &conn);
    if user_role == role {
        return true;
    }
    else {
        return false;
    }
}

pub fn compare_roles(actor: String, target: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> bool { //made for reset password not thought out for anything else
    let actor_role: i32 = user_role_search(actor.clone(), &conn).parse().expect("Not a valid number");;
    let target_role: i32 = user_role_search(target.clone(), &conn).parse().expect("Not a valid number");;

    //if actor has more or equal role than target or if the actor isnt a viewer
    if actor == target {
        return true; // trying to do so on their own
    }
    else if ( (actor_role <= target_role) && actor_role != 3 ) {
        return true;
    }
    else {
        return false;
    }
}

pub fn session_to_user(session_id: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> String {
    let mut stmt = conn.prepare("SELECT userId FROM Session WHERE id = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query([&session_id]).unwrap(); // Execute the query
    
    match rows.next() {
        Ok(Some(unwrapped_row)) => {
            // If a user is found
            let found_name: String = unwrapped_row.get(0).unwrap();
            return found_name;
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

pub fn user_password_check(username: &String, password: &String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> bool {
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

pub fn session_valid(userId: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> bool {
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

pub fn has_excess_sessions(userId: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> bool {
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
pub fn delete_session(userId: String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> () {
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
