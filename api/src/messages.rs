use actix_web::{web, Responder, HttpResponse, HttpRequest};
use rusqlite::Connection;
use serde::Deserialize;
use crate::{structs::*, token::is_login, file::get_url_token};

#[derive(Deserialize, Clone)]
pub struct Queries {
    pub start: Option<i32>,
    pub end: Option<i32>,
    pub limit: Option<i32>,
    pub page: Option<i32>,
}

pub async fn get_messages(req: HttpRequest, q: web::Query<Queries>) -> impl Responder {
    let _ = match is_login(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    
    let space_name: String = req.match_info().load().unwrap();
    let limit;
    if let Some(l) = q.limit {
        limit = l
    } else if let (Some(s), Some(e)) = (q.start, q.end) {
        limit = e - s
    } else {
        limit = 3
    }
    let offset;
    if let Some(s) = q.start {
        offset = s
    } else if let Some(p) = q.page {
        offset = (p - 1) * limit
    } else {
        offset = 0
    }

    let conn = Connection::open("app.db").unwrap();
    let mut stmt = conn.prepare("SELECT id, location, user_id, body FROM message WHERE location = ?1 ORDER BY id DESC LIMIT ?2 OFFSET ?3").unwrap();
    let rows = stmt.query_map([space_name.clone(), limit.to_string(), offset.to_string()], |row| {
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
        } else {
            messages.push(MessageResult {
                id: -1,
                location: "".to_string(),
                user_id: -1,
                body: "".to_string(),
                files: Vec::new()
            })
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

