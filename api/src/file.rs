use actix_web::{web, HttpResponse, HttpRequest, Responder};
use jwt_simple::prelude::*;
use rusqlite::Connection;
use serde::Deserialize;
use uuid::Uuid;
use crate::STATIC_FOLDER;
use crate::token::{is_login};
use futures::TryStreamExt;
use std::fs::File;
use std::io::Write;

#[derive(Serialize, Deserialize)]
pub struct UrlTokenClaims {
    pub file: String,
}

pub struct UrlTokenData {
    pub id: String,
    pub exp: u64,
    pub claims: UrlTokenClaims,
}

#[derive(Deserialize, Clone)]
pub struct Queries {
    pub token: String,
}


pub async fn post_image(req: HttpRequest, mut payload: web::Payload) -> HttpResponse {
    let token_data = match is_login(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let (space_name, message_id): (String, String) = req.match_info().load().unwrap();
    let image_name = format!("{}.png", Uuid::new_v4().to_string());

    let mut image = File::create(format!("{}/{}", STATIC_FOLDER, image_name.clone())).unwrap();
    while let Some(chunk) = payload.try_next().await.unwrap() {
        image.write_all(&chunk).unwrap();
    }

    let conn = Connection::open("app.db").unwrap();
    let mut stmt = conn.prepare("INSERT INTO message_image ( location, user_id, image_name, message_id ) VALUES (?1, ?2, ?3, ?4 )").unwrap();
    let _ = stmt.execute([space_name, token_data.sub.to_string(), image_name.clone(), message_id]).unwrap();
    HttpResponse::Ok().body(image_name)
}

pub fn get_url_token(file_name: String) -> String {
    let token_key = HS256Key::from_bytes(b"secret");
    let claims = Claims::with_custom_claims(UrlTokenClaims {
        file: file_name
    }, Duration::from_mins(1))
        .with_jwt_id(Uuid::new_v4().to_string());
    let access =  token_key.authenticate(claims).unwrap();
    access
}

pub async fn is_safe_url_token(token: String) -> Result<UrlTokenData, ()> {
    let token_key = HS256Key::from_bytes(b"secret");
    let claims = token_key.verify_token::<UrlTokenClaims>(&token, None).unwrap();
    let id = claims.jwt_id.unwrap();
    let exp = claims.expires_at.unwrap().as_millis();

    let token_data = UrlTokenData {
        id,
        exp,
        claims: UrlTokenClaims {
            file: claims.custom.file,
        }
    };
    Ok(token_data)
}


pub async fn get_image(req: HttpRequest, q: web::Query<Queries>) -> impl Responder {
    let claims = match is_safe_url_token(q.token.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let image_id: String = req.match_info().load().unwrap();
    println!("{}, {}", claims.claims.file, image_id);
    if claims.claims.file != image_id {
        return HttpResponse::BadRequest().body("");
    }
    let image = web::block(move || std::fs::read(format!("{}/{}", STATIC_FOLDER, image_id)).unwrap()).await.unwrap();
    HttpResponse::Ok().content_type("image/png").body(image)
}