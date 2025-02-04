use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct User {
    id: String,
    username: String,
    email: String,
    pass_hash: String,
}

#[derive(Serialize, Deserialize)]
pub struct Login {
    username: String,
    password: String,
}

// Add other models here