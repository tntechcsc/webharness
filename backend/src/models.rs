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


//--user management

#[derive(Serialize, Deserialize, ToSchema)]
pub struct User {
    #[schema(example = "95dcd4e0-7e1f-4686-bc90-b010ff98213e")]
    pub id: String,
    #[schema(example = "gbus")]
    pub username: String,
    #[schema(example = "gbus@gbus.com")]
    pub email: String,
    #[schema(example = "$2b$12$mhH1Yx.SoK3Jhl.PJkvi1OpMY0GL6wh79K0MIRosiZrTXM2ThTpIq")] // obviously the front end is not expected to send a hashed password. 
    pub pass_hash: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct UserInit {
    #[schema(example = "gbus")]
    pub username: String,
    #[schema(example = "gbus@gmail.com")]
    pub email: String,
    #[schema(example = "password123")]
    pub password: String,
    #[schema(example = "2 for Admin, 3 for Viewer")]
    pub role: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct Login {
    #[schema(example = "gbus")]
    pub username: String,
    #[schema(example = "password123")]
    pub password: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct Logout {
    #[schema(example = "gbus")]
    pub username: String,
    #[schema(example = "gbus@gmail.com")]
    pub email: String,
    #[schema(example = "password123")]
    pub password: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct Session {
    #[schema(example = "ajhniksdjnkdsa-7e1f-4686-bc90-b010ff98213e")]
    pub id: String,
    #[schema(example = "95dcd4e0-7e1f-4686-bc90-b010ff98213e")]
    pub userId: String,
    #[schema(example = "START TIME")]
    pub startTime: String,
    #[schema(example = "END TIME")]
    pub endTime: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ResetPasswordForm {
    #[schema(example = "gbus")]
    pub target: String,
    #[schema(example = "password123")]
    pub password: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct SetPasswordForm {
    #[schema(example = "StrongPass123!")]
    pub new_password: String,
}

//--program execution

pub struct ProcessInfo {
    pub pid: u32,
    pub status: Arc<Mutex<String>>,           // e.g., "Running", "Exited"
    pub exit_code: Arc<Mutex<Option<i32>>>,   // Exit code if the process has exited
}

#[derive(Serialize, ToSchema)]
pub struct ProcessStatusResponse {
    pub status: String,
    pub pid: u32,
    pub exit_code: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ExecuteRequest {
    #[schema(example = "application-id-123")]
    pub application_id: String,
}
// Add other models here

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ApplicationEntry {
    #[schema(example = "Calculator")]
    pub name: String,

    #[schema(example = "A simple calculator application.")]
    pub description: String,

    #[schema(example = "1")]
    pub user_id: String,

    #[schema(example = "team@example.com")]
    pub contact: Option<String>,

    #[schema(example = "C:\\Windows\\System32\\notepad.exe")]
    pub executable_path: String,

    #[schema(example = "--arg1 --arg2")]
    pub arguments: Option<String>, // Optional arguments for the application

    #[schema(example = json!(["category-id-5678", "category-id-9123"]))]
    pub category_ids: Option<Vec<String>>, // Multiple category associations
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct InstructionsEntry {
    #[schema(example = "instruction-id-1234")]
    pub id: String,

    #[schema(example = "C:\\Windows\\System32\\notepad.exe")]
    pub path: String,

    #[schema(example = "--arg1 --arg2")]
    pub arguments: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ApplicationUpdateForm {
    #[schema(example = "UUID")]
    pub id: String,

    #[schema(example = "Calculator")]
    pub name: Option<String>, //not required

    #[schema(example = "A simple calculator application.")]
    pub description: Option<String>,

    #[schema(example = "user-id-1234")]
    pub user_id: Option<String>,

    #[schema(example = "/path/to/executable")]
    pub executable_path: Option<String>,

    #[schema(example = "--arg1 --arg2")]
    pub arguments: Option<String>, // Optional arguments for the application

    //TODO ADD CATEGORY AFTER ITS UPDATED
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ApplicationDetails {
    pub id: String,
    pub user_id: String,
    pub contact: Option<String>,
    pub name: String,
    pub description: String,

    #[schema(example = json!([
        { "id": "category-id-5678", "name": "Utilities" },
        { "id": "category-id-9123", "name": "Development" }
    ]))]
    pub categories: Vec<CategoryDetails>, // Now stores both category names & IDs
}

#[derive(Serialize, Deserialize, Clone, ToSchema)]
pub struct InstructionsDetails {
    pub path: String,
    pub arguments: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct CategoryEntry {
    #[schema(example = "Utilities")]
    pub name: String,

    #[schema(example = "Applications related to system utilities")]
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct CategoryDetails {
    #[schema(example = "category-id-1234")]
    pub id: String,

    #[schema(example = "Utilities")]
    pub name: String,

    #[schema(example = "Applications related to system utilities")]
    pub description: Option<String>,
}
