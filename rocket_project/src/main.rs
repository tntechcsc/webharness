#[macro_use] extern crate rocket;
use rocket::http::Status;
use rocket::serde::{Serialize, Deserialize, json::Json}; // for handling jsons
use rocket::fs::{FileServer, NamedFile}; // for serving a file
use std::path::PathBuf; // for accessing a folder
use rusqlite::{Connection, Result}; // for our sqlite connection
use std::sync::{Arc, Mutex}; // for thread-safe access

struct DB {
    conn: Mutex<Connection>, // rust complains if there is no thread safety with our connection
}

impl DB {
    fn new() -> Result<Self> {
        let conn = Connection::open("db/harnessDB.db")?; // ? is in the case of an error
        Ok(DB { conn: Mutex::new(conn) })
    }
}

#[derive(Serialize, Deserialize)]
struct Message {
    message: String,
}

#[derive(Serialize, Deserialize)]
struct InputData {
	name: String,
	age: u32,
}

#[derive(Serialize, Deserialize)]
struct user {
    name: String,
    age: String,
}


fn user_exists(name: &String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> u32 {
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM users WHERE name = ?1").unwrap(); // Prepare your query
    let mut result = stmt.query(&[&name]).unwrap(); // Execute the query
    let mut count = 0;
    if let Some(row) = result.next().unwrap() { // Unwrap the first row
        count = row.get(0).unwrap(); // Get the first column (COUNT(*) result)
    }
    if count >= 1 {
        return 200;
    }
    else {
        return 404;
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


#[get("/")]
async fn index() -> Option<NamedFile> {
    NamedFile::open(PathBuf::from("static/index.html")).await.ok()
}

/*
    Endpoint: /user/search?<name>
    Type: GET
    Parameters: name: str, db: &rocket::State<Arc<DB>>
    Parameter Explanation: We are having the user pass a name that they want to search in the database. We are passing the
        a pointer to our database connection that is managed by rocket. We have to manage its state and shared pointer counter.
    Purpose: To search for a user in our database
*/

#[get("/user/search?<name>")]
fn user_search(name: String, db: &rocket::State<Arc<DB>>) -> Json<Message> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection

    let mut stmt = conn.prepare("SELECT * FROM users WHERE name = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query(&[&name]).unwrap(); // Execute the query
    
    match rows.next() { // Use match to handle the Option returned by next()
        Ok(Some(unwrapped_row)) => { // If there is a row
            let user_name: String = unwrapped_row.get(0).unwrap();
            let user_age: i32 = unwrapped_row.get(1).unwrap();
            let user = format!("Name: {} Age: {}", user_name, user_age);
            Json(Message { message: user }) // Return the formatted message
        }
        Ok(None) => { // If no rows were returned
            Json(Message { message: "No users found.".to_string() }) // Return no users found message
        }
        Err(_) => { // Handle any potential errors from querying
            Json(Message { message: "Error querying the database.".to_string() })
        }
    }
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


#[post("/user/register", data = "<user_data>")]
fn user_register(user_data: Json<user>, db: &rocket::State<Arc<DB>>) -> (Status, String) {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let result = user_exists(&user_data.name, &conn);
    let http_code: Status;
    let message: String;

    if result == 200 {
        //returning user not found
        http_code = Status::BadRequest;
        message = "User already exists".to_string();
        return (http_code, message);
    }

    // Prepare the SQL INSERT query
    let query = "INSERT INTO users (name, age) VALUES (?1, ?2)";

    // Execute the query with the correct types
    let result = conn.execute(query, &[&user_data.name, &user_data.age]); // Use user_data.name and user_data.age

    match result {
        Ok(_) => {
            http_code = Status::Ok;
            message = "User added".to_string();
            return (http_code, message);
        }
        Err(_) => {
            http_code = Status::BadRequest;
            message = "Bad Request".to_string();
            return (http_code, message);
        }
    }
}

#[put("/user/update", data = "<user_data>")]
fn user_update(user_data: Json<user>, db: &rocket::State<Arc<DB>>) -> (Status, String) {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let result = user_exists(&user_data.name, &conn);
    let http_code: Status;
    let message: String;

    if result == 404 {
        //returning user not found
        http_code = Status::NotFound;
        message = "User not found".to_string();
        return (http_code, message);
    }

    // Prepare the SQL INSERT query
    let query = "UPDATE users SET age = ?1 where name = ?2";

    // Execute the query with the correct types
    let result = conn.execute(query, &[&user_data.age, &user_data.name]); // Use user_data.name and user_data.age

    match result {
        Ok(_) => {
            http_code = Status::Ok;
            message = "Changes made".to_string();
            return (http_code, message);
        }
        Err(_) => {
            http_code = Status::BadRequest;
            message = "Bad request".to_string();
            return (http_code, message);
        }
    }
}

#[delete("/user/delete?<name>")]
fn user_delete(name: String, db: &rocket::State<Arc<DB>>) -> (Status, String) {
    let conn = db.conn.lock().unwrap();
    let result = user_exists(&name, &conn);
    let http_code: Status;
    let message: String;

    if result == 404 {
        //returning user not found
        http_code = Status::NotFound;
        message = "User not found".to_string();
        return (http_code, message);
    }

    // Prepare the SQL INSERT query
    let query = "DELETE FROM users WHERE name = ?1";

    // Execute the query with the correct types
    let result = conn.execute(query, &[&name]); // Use user_data.name and user_data.age

    match result {
        Ok(_) => {
            http_code = Status::Ok;
            message = "Changes made".to_string();
            return (http_code, message);
        }
        Err(_) => {
            http_code = Status::BadRequest;
            message = "Bad request".to_string();
            return (http_code, message);
        }
    }
}

#[launch]
fn rocket() -> _ {
    let db = Arc::new(DB::new().expect("Failed to initialize database")); // rust requires thread safety

    rocket::build()
    .manage(db)
    .mount("/", routes![index, goodbye, greetings, submit, user_search, user_register, user_update, user_delete])
    .mount("/static", FileServer::from("static"))
    .configure(rocket::Config {
        port: 80,
        ..Default::default()
    })
}
