use actix_web::{get, post, web, App, HttpServer, Responder, HttpResponse, HttpRequest, middleware::Logger};
use jwt_simple::prelude::*;
use serde::{Serialize, Deserialize};
use rusqlite::Connection;
use uuid::Uuid;
use env_logger::Env;
use actix_cors::Cors;

use crypto::sha2::Sha256;
use crypto::digest::Digest;


mod token;
mod structs;

use crate::structs::*;
use crate::token::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let token_key = HS256Key::from_bytes(b"secret");
    let claims = Claims::with_custom_claims(TokenClaims {refresh: false}, Duration::from_mins(15))
        .with_subject(1)
        .with_jwt_id(Uuid::new_v4().to_string());
    let access =  token_key.authenticate(claims).unwrap();
    println!("example token: {}", access);

    let conn = Connection::open("app.db").unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username STRING UNIQUE NOT NULL,
            password STRING NOT NULL
        )",
        ()
    ).unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tokenblocklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user INTEGER,
            token STRING,
            uuid STRING,
            exp INTEGER
        )",
        ()
    ).unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS message (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location STRING,
            user_id INTEGER,
            body STRING,
            FOREIGN KEY(user_id) REFERENCES user (id)
        )",
        ()
    ).unwrap();
    env_logger::init_from_env(Env::default().default_filter_or("info"));
    HttpServer::new(|| {
        let cors = Cors::default()
            .send_wildcard()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();
        App::new()
            .wrap(cors)
            .service(
                web::scope("/token")
                    .service(create_token)
                    .service(refresh_token)
            )
            .service(
                web::scope("/user")
                    .service(create_user)
                    .service(logout_user)
            )
            .service(hello)
    })
    .bind("0.0.0.0:8081")?.run().await
}