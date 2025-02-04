#[macro_use] extern crate rocket;
#[macro_use] extern crate bcrypt;

mod db;
mod routes;
mod models;
mod utils;

use rocket::launch;

#[launch]
fn rocket() -> _ {
    let db = db::DB::new().expect("Failed to initialize database");
    routes::initialize_routes(db)
}