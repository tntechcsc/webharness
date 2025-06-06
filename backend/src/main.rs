#[macro_use] extern crate rocket;
#[macro_use] extern crate bcrypt;
//rocket stuff for backend
use rocket::http::Status; // to return a status code
use rocket::serde::{Serialize, Deserialize, json::Json}; // for handling jsons
use rocket::State; // for handling state???
use rocket::request::{FromRequest, Outcome}; //for outcome and optional handling
use rocket::response::Redirect; //for redirecting on a failed session id check
use rocket::{fairing::{Fairing, Info, Kind}, Build, Rocket};


//for jsons
use serde_json::json;
//for our db connection
use rusqlite::{Connection, Result, OptionalExtension};
use rusqlite::Error;
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
use crate::execution::AppProcessMap;
use crate::execution::ProcessConnections;
use crate::execution::ProcessCountChannel;
mod db;
mod models;
mod utils;
mod user_management; // Add this line
mod execution; // Add this line
mod redirects;

pub struct SessionGuard(String);
pub struct CleanupOldLogsFairing;

// For websocket connections
use tokio::sync::broadcast;
use tokio::time::{interval, Duration as TokioDuration};
pub type ProcessUtilChannel = Arc<Mutex<Option<broadcast::Sender<String>>>>;
use crate::execution::monitor_resource_utilization;

pub struct ResourceUtilizationFairing;

#[rocket::async_trait]
impl Fairing for ResourceUtilizationFairing {
    fn info(&self) -> Info {
        Info {
            name: "Resource Utilization Monitoring",
            kind: Kind::Ignite,
        }
    }

    async fn on_ignite(&self, rocket: Rocket<Build>) -> rocket::fairing::Result {
        // Get the managed state
        let process_map = rocket.state::<ProcessMap>().unwrap().clone();
        let resource_channel = rocket.state::<ProcessUtilChannel>().unwrap().clone();

        // Spawn the background task within the Tokio runtime
        rocket::tokio::spawn(async move {
            monitor_resource_utilization(process_map, resource_channel).await;
        });
        Ok(rocket)
    }
}

async fn cleanup_old_logs(db: Arc<DB>) {
    // Set an interval to run once every day (86400 seconds)
    let mut interval = interval(TokioDuration::from_secs(86_400));
    loop {
        // Wait until the next tick.
        interval.tick().await;
        {
            // Lock the connection.
            let conn = db.conn.lock().unwrap();
            // Execute the deletion query, delete logs older than 30 days
            match conn.execute(
                "DELETE FROM SystemLogs WHERE timestamp < datetime('now', '-30 days')",
                [],
            ) {
                Ok(deleted) => {
                    println!("Deleted {} old logs", deleted);
                }
                Err(e) => {
                    eprintln!("Failed to delete old logs: {:?}", e);
                }
            }
        }
    }
}

#[rocket::async_trait]
impl Fairing for CleanupOldLogsFairing {
    fn info(&self) -> Info {
        Info {
            name: "Cleanup Old Logs Task",
            kind: Kind::Ignite,
        }
    }

    async fn on_ignite(&self, rocket: Rocket<Build>) -> rocket::fairing::Result {
        // Clone the DB state to move into the async task.
        if let Some(db) = rocket.state::<Arc<DB>>() {
            let db_clone = db.clone();
            rocket::tokio::spawn(async move {
                cleanup_old_logs(db_clone).await;
            });
        }
        Ok(rocket)
    }
}

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
                Outcome::Error((Status::new(440), ()))
            },
            Some(session_id) if !Self::is_valid_session(session_id, &conn) => {
                Outcome::Error((Status::new(440), ()))
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
            crate::user_management::user_info,
            crate::user_management::user_role_search_api, 
            crate::user_management::user_register, 
            crate::user_management::user_login, 
            crate::user_management::reset_password,
            crate::user_management::set_password,
            crate::user_management::user_delete, 
            crate::user_management::user_logout,
            crate::user_management::user_all,
            crate::user_management::role_change,

            crate::execution::execute_program, 
            crate::execution::stop_process,
            crate::execution::add_application,
            crate::execution::update_application,
            crate::execution::remove_application,
            crate::execution::get_application,
            crate::execution::get_all_applications,
            crate::execution::add_category,
            crate::execution::delete_category,
            crate::execution::get_all_categories,
            crate::execution::get_system_logs,
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
        vec![Method::Get, Method::Post, Method::Patch, Method::Delete, Method::Put]
            .into_iter()
            .map(From::from)
            .collect(),
    )
    .allow_credentials(true);

    //let db = Arc::new(DB::new().expect("Failed to initialize database")); // rust requires thread safety
    let process_map: ProcessMap = Arc::new(Mutex::new(HashMap::new())); //
    let process_connections: ProcessConnections = Arc::new(Mutex::new(HashMap::new()));
    let app_process_map: AppProcessMap = Arc::new(Mutex::new(HashMap::new()));
    let process_count_channel: ProcessCountChannel = Arc::new(Mutex::new(None));
    let resource_channel: ProcessUtilChannel = Arc::new(Mutex::new(None));
    let db = Arc::new(db::DB::new().expect("Failed to initialize database"));

    rocket::build()
        .attach(cors.to_cors().unwrap()) //attaching cors for rocket to manage it
        .attach(CleanupOldLogsFairing) // Used to delete logs older than 30 days
        .attach(ResourceUtilizationFairing) // USed to track resource utilization
        .manage(db)
        .manage(process_map)        // Used to keep track of the current processes
        .manage(process_connections) // Used to keep track of the current websocket connections
        .manage(app_process_map)  // Used to track application_id to process_id mapping. This allows us to stop programs using their application_id. We could probably combine this with process_map but I like having it seperated
        .manage(process_count_channel) // Used to keep track of the number of processes running.
        .manage(resource_channel)
        .mount("/", user_management::user_management_routes())
        .mount("/", execution::execution_routes())
        .register("/", redirects::redirect_routes())
        .mount("/",
           SwaggerUi::new("/api/swagger/<_..>").url("/api/api-docs/openapi.json", ApiDoc::openapi()),
        )
        .configure(rocket::Config {
            address: "0.0.0.0".parse().expect("invalid address"),
            port: 3000,
            ..Default::default()
        })
}