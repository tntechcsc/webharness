use rocket::{Rocket, Route, State};
use rocket::serde::json::Json;
use crate::models;
use crate::db::DB;

#[get("/api/user/search/<username>")]
pub fn user_search(username: String, db: &State<DB>) -> () {//Result<Json<serde_json::Value>, rocket::http::Status> {
    println!("WHATUP");
}

#[post("/api/user/login", data = "<user_data>")]
pub fn user_login(user_data: Json<models::Login>, db: &State<DB>) -> () {//Result<Json<serde_json::Value>, rocket::http::Status> {
    println!("YELLOW")
}

// Add other route handlers here

// Add other route handlers here

pub fn initialize_routes(db: DB) -> Rocket<rocket::Build> {
    rocket::build()
        .manage(db)
        .mount("/", routes![user_search, user_login /* Add other routes here */])
}