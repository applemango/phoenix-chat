use actix_web::{web, Responder, HttpResponse, HttpRequest};
use rusqlite::Connection;
use crate::{structs::*, token::isLogin};

use jwt_simple::prelude::*;
use crypto::sha2::Sha256;
use crypto::digest::Digest;
use uuid::Uuid;

pub async fn get_friends(req: HttpRequest) -> impl Responder {
    let claims = match isLogin(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let conn = Connection::open("app.db").unwrap();

    let mut stmt = conn.prepare("SELECT room, requester, responser FROM friend WHERE status = 1 and (requester = ?1 or responser = ?1)").unwrap();
    let rows = stmt.query_map([claims.sub], | row| {
        Ok(DBFriend{
            room: row.get(0)?,
            requester: row.get(1)?,
            responser: row.get(2)?
        })
    }).unwrap();

    let mut friends = Vec::new();
    for item in rows {
        if let Ok(item) = item {
            let id;
            if item.requester == claims.sub {
                id = item.responser;
            } else {
                id = item.requester;
            }
            friends.push(FriendsResponse {
                room: item.room,
                user_id: id
            })
        }
    }
    HttpResponse::Ok().json(friends)
}

pub async fn accept_friend(req: HttpRequest) -> impl Responder {

    HttpResponse::Ok()
}
pub async fn reject_friend(req: HttpRequest) -> impl Responder {
    HttpResponse::Ok()
}
pub async fn request_friend(req: HttpRequest) -> impl Responder {
    HttpResponse::Ok()
}
pub async fn get_friend_token(req: HttpRequest) -> impl Responder {
    let friend_id: i32 = req.clone().match_info().load().unwrap();
    let claims = match isLogin(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let conn = Connection::open("app.db").unwrap();
    
    let user = match conn.query_row("
    SELECT room, requester, responser 
        FROM friend
        WHERE status = 1
            AND (
                (requester = ?1 AND responser = ?2)
                OR
                (responser = ?1 AND requester = ?2)
            )", 
    [claims.sub, friend_id], | row | {
        Ok(DBFriend {
            room: row.get(0)?,
            requester: row.get(1)?,
            responser: row.get(2)?
        })
    }) {
        Ok(f) => f,
        Err(e) => return HttpResponse::BadRequest().body(e.to_string())
    };
    /*if !user {
        return HttpResponse::BadRequest().body("Invalid friend_id")
    }*/


    let token_key = HS256Key::from_bytes(b"secret");

    let claims = Claims::with_custom_claims(FriendTokenClaims {room: user.room}, Duration::from_secs(16))
        .with_jwt_id(Uuid::new_v4().to_string());
    let access =  token_key.authenticate(claims).unwrap();

    HttpResponse::Ok().json(FriendTokenResponse {
        token: access
    })
}