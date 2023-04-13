use actix_web::{web, Responder, HttpResponse, HttpRequest};
use rusqlite::Connection;
use crate::{structs::*, token::is_login, file::get_url_token};

pub async fn get_messages(req: HttpRequest) -> impl Responder {
    let _ = match is_login(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let space_name: String = req.match_info().load().unwrap();
    let conn = Connection::open("app.db").unwrap();
    let mut stmt = conn.prepare("SELECT id, location, user_id, body FROM message WHERE location = ?1").unwrap();
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
        if let Ok(message) = item {
            let mut stmt = conn.prepare("SELECT id, location, image_name, user_id, message_id FROM message_image WHERE message_id = ?1").unwrap();
            let rows = stmt.query_map([message.id], |row| {
                Ok(DBMessageImage {
                    id: row.get(0)?,
                    location: row.get(1)?,
                    path: row.get(2)?,
                    user_id: row.get(3)?,
                    message_id: row.get(4)?
                })
            }).unwrap();
            let mut images = Vec::new();
            for image in rows {
                if let Ok(image) = image {
                    images.push(MessageFile {
                        file_type: "image/png".to_string(),
                        path: image.path.clone(),
                        token: get_url_token(image.path)
                    });
                }
            }
            messages.push(MessageResult {
                id: message.id,
                location: message.location,
                user_id: message.user_id,
                body: message.body,
                files: images
            });
        }
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

