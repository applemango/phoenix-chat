use actix_web::{web, Responder, HttpResponse, HttpRequest};
use rusqlite::Connection;
use crate::{structs::*, token::is_login};

pub async fn get_messages(req: HttpRequest) -> impl Responder {
    let _ = match is_login(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let space_name: String = req.match_info().load().unwrap();
    let conn = Connection::open("app.db").unwrap();
    let mut stmt = conn.prepare("
        SELECT id, location, user_id, body FROM message WHERE location = ?1
    ").unwrap();
    let rows = stmt.query_map([space_name.clone()], |row| {
        Ok(DBMessage {
            id: row.get(0)?,
            location: row.get(1)?,
            user_id: row.get(2)?,
            body: row.get(3)?,
        })
    }).unwrap();
    let mut messages = Vec::new();
    for item in rows {
        messages.push(match item {
            Ok(message) => message,
            Err(_) => DBMessage {
                id: -1,
                location: space_name.clone(),
                user_id: -1,
                body: "error".to_string(),
            },
        });
    }
    HttpResponse::Ok().json(messages)
}

pub async fn add_message(req: HttpRequest, data: web::Json<AddMessageRequest>) -> impl Responder {
    let token_data = match is_login(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let space_name: String = req.match_info().load().unwrap();
    let conn = Connection::open("app.db").unwrap();
    let mut stmt = conn.prepare("
        INSERT INTO message (
            location,
            user_id,
            body
        )
        VALUES (?1, ?2, ?3)
    ").unwrap();

    let _ = stmt.execute([space_name, token_data.sub.to_string(), data.body.clone()]).unwrap();

    let message = conn.query_row("SELECT id, location, user_id, body FROM message WHERE id = last_insert_rowid()", [], |row| {
        Ok(DBMessage {
            id: row.get(0)?,
            location: row.get(1)?,
            user_id: row.get(2)?,
            body: row.get(3)?,
        })
    }).unwrap();

    HttpResponse::Ok().json(message)
}

