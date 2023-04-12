use actix_web::{web, Responder, HttpResponse, HttpRequest};
use rusqlite::Connection;
use uuid::Uuid;
use crate::{structs::*, token::is_login};
use futures::{TryStreamExt};
use std::fs::File;
use std::io::Write;


pub async fn post_image(req: HttpRequest, mut payload: web::Payload) -> HttpResponse {
    let token_data = match is_login(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let space_name: String = req.match_info().load().unwrap();
    let image_name = format!("{}.png", Uuid::new_v4().to_string());

    let mut image = File::create(format!("./static/{}",image_name.clone())).unwrap();
    while let Some(chunk) = payload.try_next().await.unwrap() {
        image.write_all(&chunk).unwrap();
    }

    let conn = Connection::open("app.db").unwrap();
    let mut stmt = conn.prepare("INSERT INTO message_image ( location, user_id, image_name ) VALUES (?1, ?2, ?3)").unwrap();
    let _ = stmt.execute([space_name, token_data.sub.to_string(), image_name.clone()]).unwrap();
    HttpResponse::Ok().body(image_name)
}