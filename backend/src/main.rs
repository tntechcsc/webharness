#[macro_use] extern crate rocket;
#[macro_use] extern crate bcrypt;
//rocket stuff for backend
use rocket::http::Status; // to return a status code
use rocket::serde::{Serialize, Deserialize, json::Json}; // for handling jsons
use rocket::State; // for handling state???
use rocket::request::{FromRequest, Outcome}; //for outcome and optional handling
use rocket::response::Redirect; //for redirecting on a failed session id check

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

//for cors
use rocket::http::Method;
use rocket_cors::{AllowedOrigins, CorsOptions};

use rocket::launch;

//for our db
use crate::db::DB;
use crate::execution::ProcessMap;

mod db;
mod models;
mod utils;
mod user_management; // Add this line
mod execution; // Add this line
mod redirects;

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
            None => {
                Outcome::Error((Status::Unauthorized, ()))
            },
            Some(session_id) if !Self::is_valid_session(session_id, &conn) => {
                Outcome::Error((Status::Unauthorized, ()))
            },
            Some(session_id) => Outcome::Success(SessionGuard(session_id.to_string())),
        }
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
        paths( 
            crate::user_management::session_validate_api,
            crate::user_management::user_search, 
            crate::user_management::user_role_search_api, 
            crate::user_management::user_register, 
            crate::user_management::user_login, 
            crate::user_management::reset_password, 
            crate::user_management::user_delete, 
            crate::user_management::user_logout,

            crate::execution::execute_program, 
            crate::execution::get_process_status, 
            crate::execution::stop_process
        ),
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

    //defining cors structure to allow stuff
    let cors = CorsOptions::default()
    .allowed_origins(AllowedOrigins::all())
    .allowed_methods(
        vec![Method::Get, Method::Post, Method::Patch]
            .into_iter()
            .map(From::from)
            .collect(),
    )
    .allow_credentials(true);

    //let db = Arc::new(DB::new().expect("Failed to initialize database")); // rust requires thread safety
    let process_map: ProcessMap = Arc::new(Mutex::new(HashMap::new()));

    let db = Arc::new(db::DB::new().expect("Failed to initialize database"));
    rocket::build()
        .attach(cors.to_cors().unwrap()) //attaching cors for rocket to manage it
        .manage(db)
        .manage(process_map)
        .mount("/", user_management::user_management_routes())
        .mount("/", execution::execution_routes())
        .register("/", redirects::redirect_routes())
        .mount("/",
           SwaggerUi::new("/api/swagger/<_..>").url("/api/api-docs/openapi.json", ApiDoc::openapi()),
        )
        .configure(rocket::Config {
            port: 3000,
            ..Default::default()
        })
}