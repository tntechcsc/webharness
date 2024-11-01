#[macro_use] extern crate rocket;
use rocket::serde::{Serialize, Deserialize, json::Json};
use rocket::fs::{FileServer, NamedFile};
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
struct Message {
    message: String,
}

#[derive(Serialize, Deserialize)]
struct InputData {
	name: String,
	age: u32,
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

#[post("/submit", format="json", data="<data>")]
fn submit(data: Json<InputData>) -> String {
    format!("Received: Name - {}, Age - {}", data.name, data.age)
}

#[launch]
fn rocket() -> _ {
    rocket::build()
    .mount("/", routes![index, goodbye, greetings, submit])
    .mount("/static", FileServer::from("static"))
    .configure(rocket::Config {
        port: 80,
        ..Default::default()
    })
}