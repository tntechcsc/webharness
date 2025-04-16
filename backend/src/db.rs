use rusqlite::{Connection, Result, OptionalExtension}; // for our sqlite connection
use std::sync::{Arc, Mutex};
use bcrypt::{DEFAULT_COST, hash, verify};
use uuid::Uuid;
use keyring::Entry;

pub struct DB {
    pub conn: Mutex<Connection>, // rust complains if there is no thread safety with our connection
}

impl DB {
    pub fn new() -> Result<Self> {
        let conn = Connection::open("harnessDB.db")?; // ? is in the case of an error

        let conn = Mutex::new(conn); // making the connection thread safe

        {
            let conn_use = conn.lock().unwrap(); // locking the connection to use it

            // Set the encryption key for SQLCipher
            // we will have to have this read from a environment variable in the future

            let store = Entry::new("Mangrove", "mangrove_db").expect("Failed to create keyring entry");

            let password = store.get_password().expect("Failed to get password");
            conn_use.execute_batch(&format!("PRAGMA key = '{}';", password))?;

            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS User (
                    id VARCHAR(36) PRIMARY KEY,
                    username VARCHAR(15) NOT NULL,
                    pass_hash VARCHAR(60) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    CHECK (length(id) <= 36),
                    CHECK (length(username) <= 15),
                    CHECK (length(pass_hash) <= 60),
                    CHECK (length(email) <= 100)
                )",
                [],
            )?;
        
            // Create the Session table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Session (
                    id VARCHAR(36) PRIMARY KEY,
                    userId VARCHAR(36),
                    startTime DATE,
                    endTime DATE,
                    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
                    CHECK (length(id) <= 36),
                    CHECK (length(userId) <= 36)         
                )",
                [],
            )?;
        
            // Create the Preferences table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Preferences (
                    userId VARCHAR(36) PRIMARY KEY,
                    theme VARCHAR(6),
                    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
                    CHECK (length(userId) <= 36),
                    CHECK (length(theme) <= 6)            
                )",
                [],
            )?;
        
            // Create the Roles table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Roles (
                    roleId VARCHAR(36) PRIMARY KEY,
                    roleName VARCHAR(36),
                    description TEXT,
                    CHECK (length(roleId) <= 36),
                    CHECK (length(roleName) <= 36)
                )",
                [],
            )?;
        
            // Create the UserRoles table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS UserRoles (
                    userId VARCHAR(36),
                    roleId VARCHAR(36),
                    PRIMARY KEY (userId, roleId),
                    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
                    FOREIGN KEY(roleId) REFERENCES Roles(roleId) ON DELETE CASCADE,
                    CHECK (length(userId) <= 36),
                    CHECK (length(roleId) <= 36),
                    CHECK (roleId IN ('1', '2', '3'))  -- Ensure roleId is either 1, 2, or 3
                )",
                [],
            )?;

            // Check if the trigger already exists before creating it
            let mut stmt = conn_use.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = 'prevent_multiple_superadmins'")?;
            let trigger_exists: bool = stmt.query_row([], |row| row.get::<_, String>(0)).optional()?.is_some();
    
            // If the trigger doesn't exist, create it
            if !trigger_exists {
                conn_use.execute(
                    "
                        CREATE TRIGGER prevent_multiple_superadmins
                        BEFORE INSERT ON UserRoles
                        FOR EACH ROW
                        WHEN NEW.roleId = 1
                        BEGIN
                            -- Check if there's already a row with roleId = 1
                            SELECT
                            CASE
                                WHEN (SELECT COUNT(*) FROM UserRoles WHERE roleId = 1) > 0
                                THEN
                                    RAISE (ABORT, 'Only one user can have roleId 1')
                            END;
                        END;
                    ",
                    [],
                )?;
            }
        
            // Create the Category table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Category (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(36),
                    description TEXT,
                    CHECK (length(id) <= 36),
                    CHECK (length(name) <= 36)
                )",
                [],
            )?;
    
            // Create the Application table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Application (
                    id VARCHAR(36) PRIMARY KEY,
                    userId VARCHAR(36),
                    contact VARCHAR(100),
                    name VARCHAR(36),
                    description TEXT,
                    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
                    CHECK (length(id) <= 36),
                    CHECK (length(userId) <= 36),
                    CHECK (length(contact) <= 100),
                    CHECK (length(name) <= 36)
                )",
                [],
            )?;
            
            // Create the CategoryApplication table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS CategoryApplication (
                    category_id VARCHAR(36),
                    application_id VARCHAR(36),
                    PRIMARY KEY (category_id, application_id),
                    FOREIGN KEY(category_id) REFERENCES Category(id) ON DELETE CASCADE,
                    FOREIGN KEY(application_id) REFERENCES Application(id) ON DELETE CASCADE,
                    CHECK (length(category_id) <= 36),
                    CHECK (length(application_id) <= 36)
                )",
                [],
            )?;

            // Create the Instructions table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Instructions (
                    id VARCHAR(36) PRIMARY KEY,
                    application_id VARCHAR(36),
                    path VARCHAR(256),
                    arguments VARCHAR(256),
                    FOREIGN KEY(application_id) REFERENCES Application(id) ON DELETE CASCADE,
                    CHECK (length(id) <= 36),
                    CHECK (length(application_id) <= 36),
                    CHECK (length(path) <= 256),
                    CHECK (length(arguments) <= 256)
                )",
                [],
            )?;
        
            // Create the Process table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Process (
                    id VARCHAR(36),
                    pid INTEGER,
                    status VARCHAR(36),
                    PRIMARY KEY(id),
                    FOREIGN KEY(id) REFERENCES Application(id) ON DELETE CASCADE,
                    CHECK (length(id) <= 36),
                    CHECK (length(status) <= 36)
                )",
                [],
            )?;
            
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS SystemLogs (
                     id VARCHAR(36) PRIMARY KEY,       -- Unique identifier for the log entry
                     event TEXT NOT NULL,              -- The type of event (e.g., 'user_deleted', 'app_started')
                     data TEXT NOT NULL,               -- JSON data containing additional details about the event
                     timestamp DATETIME DEFAULT (datetime('now','localtime')) -- Local timestamp of the log entry
                 )",
                [],
            )?;            

            // Creating Superadmin, admin, and viewer roles
            conn_use.execute(
                "INSERT OR IGNORE INTO Roles (roleId, roleName, description) VALUES (?1, ?2, ?3)",
                &["1", "Superadmin", "A special admin that manages every single other user"],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Roles (roleId, roleName, description) VALUES (?1, ?2, ?3)",
                &["2", "Admin", "A admin that manages other users(Viewers)"],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Roles (roleId, roleName, description) VALUES (?1, ?2, ?3)",
                &["3", "Viewer", "A regular user that can only view and run programs"],
            )?;

            let store = Entry::new("Mangrove", "superuser").expect("Failed to create keyring entry");

            let password = store.get_password().expect("Failed to get password");
            let pass_hash = hash(&password, DEFAULT_COST).unwrap(); // Hash the password
            // Creating Superadmin, admin, and viewer roles
            conn_use.execute(
                "INSERT OR IGNORE INTO User (id, username, pass_hash, email) VALUES (?1, ?2, ?3, ?4)",
                &["1", "su", &pass_hash, "email@email.com"],
            )?;

            conn_use.execute(
                "INSERT OR IGNORE INTO UserRoles (userId, roleId) VALUES (?1, ?2)",
                &["1", "1"],
            )?;


            // =========================== TESTING DATA ===========================
            // Create 5 test applications with userID 1 for national defense projects using incrementing integer IDs
            conn_use.execute(
                "INSERT OR IGNORE INTO Application (id, userId, contact, name, description) VALUES (1, '1', 'defense_contact_1', 'SeaGuardian', 'Naval surveillance and reconnaissance system.')",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Application (id, userId, contact, name, description) VALUES (2, '1', 'defense_contact_2', 'HarpoonBlockII', 'Anti-ship missile system for littoral waters defense.')",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Application (id, userId, contact, name, description) VALUES (3, '1', 'defense_contact_3', 'TridentII', 'Submarine-launched ballistic missile (SLBM) system.')",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Application (id, userId, contact, name, description) VALUES (4, '1', 'defense_contact_4', 'AegisCombat', 'Integrated naval weapons system for missile defense.')",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Application (id, userId, contact, name, description) VALUES (5, '1', 'defense_contact_5', 'TomahawkBlockV', 'Long-range, all-weather, subsonic cruise missile.')",
                [],
            )?;


            // populate categories
            conn_use.execute(
                "INSERT OR IGNORE INTO Category (id, name, description) VALUES (1, 'Python', 'Applications built using the Python programming language.')",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Category (id, name, description) VALUES (2, 'C++', 'Applications developed with the C++ programming language.')",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Category (id, name, description) VALUES (3, 'Rust', 'Applications written in the Rust programming language.')",
                [],
            )?;

            // associate applications with categories
            conn_use.execute(
                "INSERT OR IGNORE INTO CategoryApplication (category_id, application_id) VALUES (1, 1)",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO CategoryApplication (category_id, application_id) VALUES (2, 2)",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO CategoryApplication (category_id, application_id) VALUES (3, 3)",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO CategoryApplication (category_id, application_id) VALUES (1, 4)",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO CategoryApplication (category_id, application_id) VALUES (2, 5)",
                [],
            )?;

            // Insert instructions for each application
            conn_use.execute(
                "INSERT OR IGNORE INTO Instructions (id, application_id, path, arguments) VALUES (1, 1, '/path/to/python/app', '--arg1 --arg2')",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Instructions (id, application_id, path, arguments) VALUES (2, 2, '/path/to/cpp/app', '--flag1 --flag2')",
                [],
            )?;
            conn_use.execute(
                "INSERT OR IGNORE INTO Instructions (id, application_id, path, arguments) VALUES (3, 3, '/path/to/rust/app', '--option1 --option2')",
                [],
            )?;
            }

        Ok(DB { conn })
    }
}