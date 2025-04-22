[thanks]: <> (Cheat Engine for the format)


<p align="center">
  <img width="250" src="/img/Mangrove_Logo_Only.svg">
</p>

<h1 style="text-align:center;">
Mangrove
</h1>

Mangrove is a Windows application management tool focused on supporting multiple user's safetly using: SQLCipher and Rust,


## Download 
[TODO]: <> (switch this to real release)
- [Release](https://github.com/tntechcsc/webharness/releases)

## Requirements to compile and run

### Node
Node and NPM are required to run the frontend portion of this application. It is recommended to use a node management tool like [NVM-Windows](https://github.com/coreybutler/nvm-windows). 

- Install at their release page [here](https://github.com/coreybutler/nvm-windows/releases), I would reccommend their setup version to make it easier.
- You may or may not have PATH issues
- Run `nvm install latest` in the terminal to install the latest version of Node.js
- Run `nvm use latest` to use that version of node
- Head to /frontend and run `npm install` to install all the dependencies

### Perl
A requirement of our backend server is SQLCipher. This is because as this is a application meant to be installed locally, and used by many people, it is imperative to enforce roles and security. SQLCipher allows for the database to be encrypted at rest, meaning no one can arbitrarily come and look into the database, thereby bypassing many security and role imperatives.

To use SQLCipher, it is required to have OpenSSL, a open source software library used for data encryption and more. SQLCipher is just an extension of SQLite with something like OpenSSL to encrpyt it. It's required to build OpenSSL from source with the way our backend server is ran, but cargo does this automatically. So, it is required to have Perl to compile OpenSSL.

You can download it [here](https://strawberryperl.com/), or run this shell script in Powershell:
```
Invoke-WebRequest -Uri https://strawberryperl.com/download/5.32.1.1/strawberry-perl-5.32.1.1-64bit.msi -OutFile strawberry-perl.msi
```

## Rust
A key part of this application is to use a secure and effecient way to develop and run our backend server. We accomplished this by utilizing rust, a high quality memory safe language that is about as performant as C/C++. But also, this project would've been too easy otherwise. Rust can be downloaded and installed [here](https://www.rust-lang.org/tools/install). This will install rustc, the rust compiler; rustup, the rust version manager; and cargo, rust's package manager. 

## SQLCipher
SQLCipher is our database of choice for this project. SQLCipher is effectively just sqlite with additional security features, but the main one that was wanted from it for this project is encryption at rest. This means that if a malicious actor somehow downloads the database, they would be unable to see the contents of it without the password. This is accomplished via OpenSSL. You don't have to install this locally, but you can still download a database viewer [here](https://sqlitebrowser.org/). That comes with a sqlite and sqlcipher db viewer. 

## Building the Backend Server
To build the backend, just head to /backend and run `cargo build --release`, this will build a executable of the backend. If you just want to make a development server, run `cargo build`. To run this development server, run `cargo run` afterwards. The executable will be at /backend/target/release/backend.exe.

## Building the Frontend Server
The frontend portion of this project uses React.js and Electron.js. React.js is a library that is used to enhance the programmatical qualities of this project, and was a great use. This is installed by running `npm install` in the /frontend directory. Electron.js is a library used to effectively turn our frontend project into a exportable packaged program that can be ran on any computer. It is commonly used to make cross-platform desktop apps with JS, HTML, and CSS.

So, to build the frontend it is expected that to use electron and electron-packager, our packager of choice, to make a desktop app out of Mangrove. Though, Mangrove can still be ran in a development environment using `npm run start` like normal. 

### Production build
to package with electron you need to:\
`npm run package`\
then you need to go to scripts and run `node copy-backend.js`. Though, you can optionally just copy the backend exe into the built frontend project folder.

### Development build
to run normally:\
`npm run start`

### How to run with electron (Development)
to run with electron typically you need to:\
`npm run build`\
go to scripts and run `node copy-backend-dev.js`\
`npm run start`\
`npm run electron`

### Easier way to run with electron (Deveelopment)
to run with dev, which is preferred for testing electron:\
`npm run build`\
go to scripts and run\
`node copy-backend-dev.js`\
`npm run dev`


## Running a Development Server
If you want to run a development version of Mangrove, all you need to do is run both the backend and frontend in their respective development version. For the backend, head to /backend and run `cargo run` For the frontend, head to /frontend and run `npm start`.

## Building from Source
Now, you have the tools to properly build Mangrove from source. The steps are:
- Head to /backend and run `cargo build --release`
- Head to /frontend and run `npm run package`
- Head to /frontend/scripts and run `node copy-backend.js`

## Running Development Version
To run Mangrove for development purpose, you can optionally run `./startup.bat`, but to do it manually it would be:
- Open a terminal and go to /backend and run `cargo run`
- Open a terminal and go to /frontend and run `npm run start`

## Running Production Version
Get your production version of mangrove (frontend-win32-x64) and head to the frontend.exe in the folder. Just run that frontend exe and done, it should be running.