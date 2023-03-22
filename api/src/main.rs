/*
 * unwrapを多用しているためerrorが出た場合panic!に陥りresponse自体が帰ってこないことが多いですがめんどくさいので使っています
 */
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
mod messages;
mod private;

use crate::structs::*;
use crate::token::*;
use crate::messages::*;
use crate::messages::add_message;
use crate::private::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let token_key = HS256Key::from_bytes(b"secret");
    let claims = Claims::with_custom_claims(TokenClaims {refresh: false}, Duration::from_mins(15))
        .with_subject(1)
        .with_jwt_id(Uuid::new_v4().to_string());
    let access =  token_key.authenticate(claims).unwrap();
    println!("example token: {}", access);
    println!("example uuid: {}", Uuid::new_v4().to_string());

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
    conn.execute(
        "CREATE TABLE IF NOT EXISTS friend (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room STRING,
            requester INTEGER,
            responser INTEGER,
            /*
             * status 0: no response
             * status 1: successful
             * status 2: rejected
             */
            status INTEGER,
            FOREIGN KEY (requester) REFERENCES user (id),
            FOREIGN KEY (responser) REFERENCES user (id)
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
                    .service(
                        web::scope("/friends")
                            .route("", web::get().to(get_friends))
                            .service(
                                web::scope("/{friend_id}")
                                    .route("/accept", web::post().to(accept_friend))
                                    .route("/reject", web::post().to(reject_friend))
                                    .route("/request", web::post().to(request_friend))
                                    .route("/token", web::get().to(get_friend_token))
                            )
                        
                    )
            )
            .service(
                web::scope("/messages")
                    .route("/{space_name}", web::post().to(add_message))
                    .route("/{space_name}", web::get().to(get_messages))
            )
            .service(hello)
    })
    .bind("0.0.0.0:8081")?.run().await
}