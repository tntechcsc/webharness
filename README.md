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

### Perl
A requirement of our backend server is SQLCipher. This is because as this is a application meant to be installed locally, and used by many people, it is imperative to enforce roles and security. SQLCipher allows for the database to be encrypted at rest, meaning no one can arbitrarily come and look into the database, thereby bypassing many security and role imperatives.

To use SQLCipher, it is required to have OpenSSL, a open source software library used for data encryption and more. SQLCipher is just an extension of SQLite with something like OpenSSL to encrpyt it. It's required to build OpenSSL from source with the way our backend server is ran, but cargo does this automatically. So, it is required to have Perl to compile OpenSSL.

You can download it [here](https://strawberryperl.com/), or run this shell script in Powershell:
```
Invoke-WebRequest -Uri https://strawberryperl.com/download/5.32.1.1/strawberry-perl-5.32.1.1-64bit.msi -OutFile strawberry-perl.msi
```

## Rust
A key part of this application is to use a secure and effecient way to run our backend server.

## Running

to run the backend head to /backend/ and run `cargo run`

to run the frontend head to /frontend/ and run `npm start`
