use crate::structs::*;
use actix_web::{get, post, web, App, HttpServer, Responder, HttpResponse, HttpRequest, middleware::Logger};
use jwt_simple::prelude::*;
use serde::{Serialize, Deserialize};
use rusqlite::Connection;
use crypto::sha2::Sha256;
use crypto::digest::Digest;
use uuid::Uuid;

fn get_token(req: HttpRequest) -> String {
    return req.headers().get("Authorization").unwrap().to_str().unwrap()[7..].to_string();
}

fn blocked(uuid: String) -> bool {
    let db_con = Connection::open("app.db").unwrap();
    let _ = match db_con.query_row("SELECT uuid FROM tokenblocklist WHERE uuid = ( ?1 )", [&uuid], |_| {Ok(true)}) {
        Ok(_) => return true,
        Err(_) => return false
    };
}

#[post("/register")]
async fn create_user(data: web::Json<CreateTokenRequest>) -> impl Responder {
    let conn = Connection::open("app.db").unwrap();
    let mut stmt = conn.prepare("INSERT INTO user ( username, password ) values ( ?1, ?2 )").unwrap();
    let mut sha = Sha256::new();
    sha.input_str(&data.password);
    let _ = stmt.execute(&[&data.username, &sha.result_str()]).unwrap();

    HttpResponse::Ok()
}

#[post("/create")]
async fn create_token(data: web::Json<CreateTokenRequest>) -> impl Responder {
    let conn = Connection::open("app.db").unwrap();
    let u = conn.query_row("SELECT id, username, password FROM user WHERE username = ( ?1 )", [&data.username], |row| {
        Ok(User {
            id: row.get(0)?,
            username: row.get(1)?,
            password: row.get(2)?
        })
    }).unwrap();
    let mut sha = Sha256::new();
    sha.input_str(&data.password);
    if !(data.username == u.username && sha.result_str() == u.password) {
        return HttpResponse::BadRequest().body("user does not exist or password is wrong")
    }

    let token_key = HS256Key::from_bytes(b"secret");

    let claims = Claims::with_custom_claims(TokenClaims {refresh: false}, Duration::from_mins(15))
        .with_subject(u.id)
        .with_jwt_id(Uuid::new_v4().to_string());
    let access =  token_key.authenticate(claims).unwrap();
    
    let claims = Claims::with_custom_claims(TokenClaims {refresh: true}, Duration::from_hours(24))
        .with_subject(u.id)
        .with_jwt_id(Uuid::new_v4().to_string());
    let refresh =  token_key.authenticate(claims).unwrap();

    HttpResponse::Ok().json(CreateTokenResponse {
        token: access,
        refresh_token: refresh,
    })
}

#[post("/refresh")]
async fn refresh_token(req: HttpRequest) -> impl Responder {
    let token_key = HS256Key::from_bytes(b"secret");
    let claims = token_key.verify_token::<TokenClaims>(&get_token(req), None).unwrap();
    if ! claims.custom.refresh {
        return HttpResponse::BadRequest().body("Access tokens are not allowed")
    }
    if blocked(claims.jwt_id.unwrap()) {
        return HttpResponse::BadRequest().body("That token cannot be used for some reason")
    }

    let claims = Claims::with_custom_claims(TokenClaims {refresh: false}, Duration::from_mins(15))
        .with_subject(claims.subject.unwrap())
        .with_jwt_id(Uuid::new_v4().to_string());
    let token =  token_key.authenticate(claims).unwrap();
    HttpResponse::Ok().json(CreateRefreshTokenResponse {
        token: token
    })
}

#[post("/logout")]
async fn logout_user(req: HttpRequest) -> impl Responder {
    let token_key = HS256Key::from_bytes(b"secret");
    let claims = token_key.verify_token::<TokenClaims>(&get_token(req), None).unwrap();
    if let Some(uuid) = claims.jwt_id {
        let db_con = Connection::open("app.db").unwrap();
        let mut stmt = db_con.prepare("INSERT INTO tokenblocklist ( uuid ) values ( ?1 )").unwrap();
        let _ = stmt.execute([uuid]).unwrap();
        return HttpResponse::Ok().body("Deleted")
    }
    HttpResponse::InternalServerError().body("??????")
}

#[get("/hello")]
async fn hello(req: HttpRequest) -> impl Responder {
    let token_key = HS256Key::from_bytes(b"secret");
    let claims = token_key.verify_token::<TokenClaims>(&get_token(req), None).unwrap();
    if claims.custom.refresh {
        return HttpResponse::BadRequest().body("Refresh tokens are not allowed")
    }
    if blocked(claims.jwt_id.unwrap()) {
        return HttpResponse::BadRequest().body("That token cannot be used for some reason")
    }
    HttpResponse::Ok().body("Hello world!")
}

pub async fn isLogin(req: HttpRequest) -> Result<TokenData, ()> {
    let token = get_token(req);

    let token_key = HS256Key::from_bytes(b"secret");

    let claims = token_key.verify_token::<TokenClaims>(&token, None).unwrap();

    let db_con = Connection::open("app.db").unwrap();

    let uuid;
    match claims.jwt_id {
        Some(d) => uuid = d,
        None => return Err(())
    }

    let sub;
    let exp;
    match claims.subject {
        Some(d) => sub = d.parse::<i32>().unwrap(),
        None => return Err(())
    }
    match claims.expires_at {
        Some(d) => exp = d.as_millis(),
        None => return Err(())
    }

    let u = match db_con.query_row("SELECT uuid FROM tokenblocklist WHERE uuid = ( ?1 )", [&uuid], |_| {
        Ok(true)
    }) {
        Ok(_) => {
            return Err(())
        },
        Err(_) => true
    };

    if !u {
        return Err(())
    }

    if claims.custom.refresh {
        return Err(())
    }
    let token_data = TokenData {
        id: uuid,
        sub: sub,
        exp: exp,
        TokenClaims: TokenClaims {
            refresh: claims.custom.refresh,
        }
    };
    Ok(token_data)
}
