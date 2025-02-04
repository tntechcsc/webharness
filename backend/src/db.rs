use rusqlite::{Connection, Result, OptionalExtension}; // for our sqlite connection
use std::sync::{Arc, Mutex};
use bcrypt::{DEFAULT_COST, hash, verify};

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
            conn_use.execute_batch("PRAGMA key = 'my_secure_passphrase';")?;

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
                    category_id VARCHAR(36),
                    FOREIGN KEY(userId) REFERENCES User(id) ON DELETE CASCADE,
                    FOREIGN KEY(category_id) REFERENCES Category(id) ON DELETE SET NULL,
                    CHECK (length(id) <= 36),
                    CHECK (length(userId) <= 36),
                    CHECK (length(contact) <= 100),
                    CHECK (length(name) <= 36),
                    CHECK (length(category_id) <= 36)
                )",
                [],
            )?;
        
            // Create the Instructions table
            conn_use.execute(
                "CREATE TABLE IF NOT EXISTS Instructions (
                    id VARCHAR(36) PRIMARY KEY,
                    path VARCHAR(256),
                    arguments VARCHAR(256),
                    CHECK (length(id) <= 36),
                    CHECK (length(id) <= 256),
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

            let pass_hash = hash("password123", DEFAULT_COST).unwrap(); // Hash the password
            // Creating Superadmin, admin, and viewer roles
            conn_use.execute(
                "INSERT OR IGNORE INTO User (id, username, pass_hash, email) VALUES (?1, ?2, ?3, ?4)",
                &["1", "su", &pass_hash, "email@email.com"],
            )?;

            conn_use.execute(
                "INSERT OR IGNORE INTO UserRoles (userId, roleId) VALUES (?1, ?2)",
                &["1", "1"],
            )?;
        }

        Ok(DB { conn })
    }
}