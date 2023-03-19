use serde::{Serialize, Deserialize};
#[derive(Deserialize)]
pub struct CreateTokenRequest {
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct CreateTokenResponse {
    pub token: String,
    pub refresh_token: String,
}

#[derive(Serialize)]
pub struct CreateRefreshTokenResponse {
    pub token: String,
}

#[derive(Serialize, Deserialize)]
pub struct TokenClaims {
    pub refresh: bool,
}

pub struct TokenData {
    pub id: String,
    pub sub: i32,
    pub exp: u64,
    pub TokenClaims: TokenClaims,

}

#[derive(Serialize)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct AddMessageRequest {
    pub body: String,
}

#[derive(Serialize)]
pub struct DBMessage {
    pub id: i32,
    pub location: String,
    pub user_id: i32,
    pub body: String,
}