#[macro_use] extern crate rocket;
use rocket::serde::{Serialize, Deserialize, json::Json};
use rocket::fs::{FileServer, NamedFile};
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
struct Message {
    message: String,
}

#[get("/")]
async fn index() -> Option<NamedFile> {
    NamedFile::open(PathBuf::from("static/index.html")).await.ok()
}

#[get("/greetings")]
fn greetings() -> Json<Message> {
    let message = "Hello, Rocket!".to_string();
    Json(Message { message })
}

#[get("/<name>/<age>")]
fn goodbye(name: &str, age: u8) -> String {
    format!("Hello, {} year old named {}!", age, name)
}

#[post("/submit")]
fn submit() -> String {
    "HEY".to_string()
}

#[launch]
fn rocket() -> _ {
    rocket::build()
    .mount("/", routes![index, goodbye, greetings])
    .mount("/static", FileServer::from("static"))
    .configure(rocket::Config {
        port: 80,
        ..Default::default()
    })
}