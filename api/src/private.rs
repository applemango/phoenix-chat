use actix_web::{Responder, HttpResponse, HttpRequest};
use rusqlite::Connection;
use crate::{structs::*, token::is_login};

use jwt_simple::prelude::*;
use uuid::Uuid;

pub async fn get_wait_response(req: HttpRequest) -> impl Responder {
    let claims = match is_login(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let conn = Connection::open("app.db").unwrap();

    let mut stmt = conn.prepare("SELECT room, requester, responser FROM friend WHERE status = 0 and (requester = ?1 or responser = ?1)").unwrap();
    let rows = stmt.query_map([claims.sub], | row| {
        Ok(DBFriend{
            room: row.get(0)?,
            requester: row.get(1)?,
            responser: row.get(2)?
        })
    }).unwrap();

    let mut req = Vec::new();
    let mut res = Vec::new();

    for item in rows {
        if let Ok(item) = item {
            if item.requester == claims.sub {
                req.push(FriendsResponse {
                    room: item.room,
                    user_id: item.responser
                })
            } else {
                res.push(FriendsResponse {
                    room: item.room,
                    user_id: item.requester
                })
            }
        }
    }
    let response = FriendWaitResponseResponse {
        request: req,
        response: res
    };
    HttpResponse::Ok().json(response)
}

pub async fn get_friends(req: HttpRequest) -> impl Responder {
    let claims = match is_login(req.clone()).await {
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

pub async fn request_friend(req: HttpRequest) -> impl Responder {
    let friend_id: i32 = req.clone().match_info().load().unwrap();
    let claims = match is_login(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let conn = Connection::open("app.db").unwrap();

    let _ = match conn.query_row("
    SELECT room, requester, responser 
        FROM friend
        WHERE
            (requester = ?1 AND responser = ?2)
            OR
            (responser = ?1 AND requester = ?2)", 
    [claims.sub, friend_id], | _ | {Ok(true)}) {
        Ok(_) => return HttpResponse::BadRequest().body("request...?, why"),
        Err(_) => true
    };

    let mut stmt = conn.prepare("
        INSERT INTO friend (
            room,
            requester,
            responser,
            status
        )
        VALUES (?1, ?2, ?3, ?4)
    ").unwrap();

    let _ = stmt.execute([
        Uuid::new_v4().to_string(),
        claims.sub.to_string(),
        friend_id.to_string(),
        0.to_string()
    ]).unwrap();

    HttpResponse::Ok().body("request successfully")
}

pub async fn accept_friend(req: HttpRequest) -> impl Responder {
    let friend_id: i32 = req.clone().match_info().load().unwrap();
    let claims = match is_login(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let conn = Connection::open("app.db").unwrap();

    let _ = match conn.query_row("
    SELECT room, requester, responser FROM friend WHERE responser = ?1 AND requester = ?2 AND status = 0", 
    [claims.sub, friend_id], | _ | {Ok(true)}) {
        Ok(_) => true,
        Err(_) => return HttpResponse::BadRequest().body("Hahaha")
    };

    let _ = conn.execute("UPDATE friend SET  status = 1 WHERE responser = ?1 AND requester = ?2", [claims.sub, friend_id]).unwrap();

    HttpResponse::Ok().body("now, you have new friends!!!")
}
pub async fn reject_friend(req: HttpRequest) -> impl Responder {
    let friend_id: i32 = req.clone().match_info().load().unwrap();
    let claims = match is_login(req.clone()).await {
        Ok(token) => token,
        Err(_) => return HttpResponse::Unauthorized().body("invalid token"),
    };
    let conn = Connection::open("app.db").unwrap();

    let _ = match conn.query_row("
    SELECT room, requester, responser FROM friend WHERE responser = ?1 AND requester = ?2 AND status = 0", 
    [claims.sub, friend_id], | _ | {Ok(true)}) {
        Ok(_) => true,
        Err(_) => return HttpResponse::BadRequest().body("Hahaha")
    };

    let _ = conn.execute("UPDATE friend SET  status = 2 WHERE responser = ?1 AND requester = ?2", [claims.sub, friend_id]).unwrap();

    HttpResponse::Ok().body("what?, no way")
}

pub async fn get_friend_token(req: HttpRequest) -> impl Responder {
    let friend_id: i32 = req.clone().match_info().load().unwrap();
    let claims = match is_login(req.clone()).await {
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