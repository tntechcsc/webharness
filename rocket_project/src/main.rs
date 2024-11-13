#[macro_use] extern crate rocket;
#[macro_use] extern crate bcrypt;
use rocket::http::Status;
use rocket::serde::{Serialize, Deserialize, json::Json}; // for handling jsons
use rocket::fs::{FileServer, NamedFile}; // for serving a file
use std::path::PathBuf; // for accessing a folder
use rusqlite::{Connection, Result}; // for our sqlite connection
use std::sync::{Arc, Mutex}; // for thread-safe access
use utoipa::{OpenApi, ToSchema, IntoParams};
use utoipa_swagger_ui::SwaggerUi;
use bcrypt::{DEFAULT_COST, hash, verify};

struct DB {
    conn: Mutex<Connection>, // rust complains if there is no thread safety with our connection
}

impl DB {
    fn new() -> Result<Self> {
        let conn = Connection::open("db/harnessDB.db")?; // ? is in the case of an error
        Ok(DB { conn: Mutex::new(conn) })
    }
}

#[derive(Serialize, Deserialize, ToSchema)]
struct Message {
    #[schema(example = "Hello World")]
    message: String,
}

#[derive(Serialize, Deserialize, ToSchema, IntoParams)]
struct InputData {
    #[schema(example = "Tim")]
	name: String,
    #[schema(example = "21")]
	age: u32,
}

#[derive(Serialize, Deserialize, ToSchema)]
struct Person {
    name: String,
    age: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
struct User {
    id: String,
    username: String,
    pass_hash: String,
    pass_salt: String,
    name: String.
}

fn user_exists(username: &String, conn: &std::sync::MutexGuard<'_, rusqlite::Connection>) -> u32 {
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM Users WHERE username = ?1").unwrap(); // Prepare your query
    let mut result = stmt.query(&[&username]).unwrap(); // Execute the query
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

#[utoipa::path(
    get,
    path = "/",
    tag = "Page Management",
    responses(
        (status = 200, description = "Page loaded"),
        (status = 404, description = "Not Found")
    )
    )]
#[get("/")]
async fn index() -> Option<NamedFile> {
    NamedFile::open(PathBuf::from("static/index.html")).await.ok()
}

#[utoipa::path(
    get,
    path = "/user/search/{name}",
    tag = "User Management",
    responses(
        (status = 200, description = "User found"),
        (status = 404, description = "User not found")
    ),
    params(
        ("username", description = "A user's username")
    )
    )]
#[get("/user/search/<name>")]
fn user_search(username: String, db: &rocket::State<Arc<DB>>) -> Json<Message> {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection

    let mut stmt = conn.prepare("SELECT * FROM users WHERE username = ?1").unwrap(); // Prepare your query
    let mut rows = stmt.query(&[&username]).unwrap(); // Execute the query
    
    //**CHANGEME
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

#[utoipa::path(
    get,
    path = "/greetings",
    tag = "Alive",
    responses(
        (status = 200, description = "Greetings")
    ),
    params()
    )]
#[get("/greetings")]
fn greetings() -> Json<Message> {
    let message = "Hello, Rocket!".to_string();
    Json(Message { message })
}

#[utoipa::path(
    get,
    path = "/{name}/{age}",
    tag = "Alive",
    responses(
        (status = 200, description = "Hello, <age> year old named <name>!")
    ),
    params(
        ("name", description = "name of person"),
        ("age", description = "age of person")
    )
    )]
#[get("/<name>/<age>")]
fn goodbye(name: &str, age: u8) -> String {
    format!("Hello, {} year old named {}!", age, name)
}

#[utoipa::path(
    post,
    path = "/submit",
    tag = "Alive",
    responses(
        (status = 200, description = "Received: Name - <name>, Age - <age>")
    ),
    request_body = InputData,
    )]
#[post("/submit", format="json", data="<data>")]
fn submit(data: Json<InputData>) -> String {
    format!("Received: Name - {}, Age - {}", data.name, data.age)
}

#[utoipa::path(
    post,
    path = "/user/register",
    tag = "User Management",
    responses(
        (status = 200, description = "Creates a user in our database")
    ),
    request_body = User
    )]
#[post("/user/register", data = "<user_data>")]
fn user_register(user_data: Json<User>, db: &rocket::State<Arc<DB>>) -> (Status, String) {
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

    //**CHANGEME
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

#[utoipa::path(
    put,
    path = "/user/update",
    tag = "User Management",
    responses(
        (status = 200, description = "Updates user info"),
        (status = 404, description = "User not found")
    ),
    request_body = User
    )]
#[put("/user/update", data = "<user_data>")]
fn user_update(user_data: Json<User>, db: &rocket::State<Arc<DB>>) -> (Status, String) {
    let conn = db.conn.lock().unwrap(); // Lock the mutex to access the connection
    let result = user_exists(&user_data.username, &conn);
    let http_code: Status;
    let message: String;

    if result == 404 {
        //returning user not found
        http_code = Status::NotFound;
        message = "User not found".to_string();
        return (http_code, message);
    }

    //**CHANGEME
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

#[utoipa::path(
    delete,
    path = "/user/delete/{name}",
    tag = "User Management",
    responses(
        (status = 200, description = "Deletes a user"),
        (status = 404, description = "User not found")
    ),
    params(
        ("name", description = "name of person you want to delete")
    )
    )]
#[delete("/user/delete/<name>")]
fn user_delete(username: String, db: &rocket::State<Arc<DB>>) -> (Status, String) {
    let conn = db.conn.lock().unwrap();
    let result = user_exists(&username, &conn);
    let http_code: Status;
    let message: String;

    if result == 404 {
        //returning user not found
        http_code = Status::NotFound;
        message = "User not found".to_string();
        return (http_code, message);
    }

    //CHANGEME
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
    #[derive(OpenApi)]
    #[openapi(
        tags(
            (name = "User Management", description = "User management endpoints."),
            (name = "Alive", description = "Endpoints to see if the rocket server is live."),
            (name = "Page Management", description = "Endpoints to open pages")
        ),
        paths(user_search, user_register, user_update, user_delete, greetings, goodbye, submit, index)
    )]
    pub struct ApiDoc;
    
    let db = Arc::new(DB::new().expect("Failed to initialize database")); // rust requires thread safety

    rocket::build()
    .manage(db)
    .mount("/",
           SwaggerUi::new("/docs/swagger-ui/<_..>").url("/swagger/openapi.json", ApiDoc::openapi()),
    )
    .mount("/", routes![index, goodbye, greetings, submit, user_search, user_register, user_update, user_delete])
    .mount("/static", FileServer::from("static"))
    .configure(rocket::Config {
        port: 80,
        ..Default::default()
    })
}
