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
    pub token_claims: TokenClaims,

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

#[derive(Serialize, Clone)]
pub struct DBMessage {
    pub id: i32,
    pub location: String,
    pub user_id: i32,
    pub body: String,
}

#[derive(Serialize)]
pub struct DBMessageImage {
    pub id: i32,
    pub location: String,
    pub path: String,
    pub user_id: i32,
    pub message_id: i32
}

#[derive(Serialize)]
pub struct MessageFile {
    pub file_type: String,
    pub path: String,
    pub token: String
}

#[derive(Serialize)]
pub struct MessageResult {
    pub id: i32,
    pub location: String,
    pub user_id: i32,
    pub body: String,
    pub files: Vec<MessageFile>
}


#[derive(Serialize)]
pub struct DBFriend {
    pub room: String,
    pub requester: i32,
    pub responser: i32,
}

#[derive(Serialize)]
pub struct FriendsResponse {
    pub room: String,
    pub user_id: i32,
}

#[derive(Serialize, Deserialize)]
pub struct FriendTokenClaims {
    pub room: String,
}

#[derive(Serialize)]
pub struct FriendTokenResponse {
    pub token: String,
}

#[derive(Serialize)]
pub struct FriendWaitResponseResponse {
    pub request: Vec<FriendsResponse>,
    pub response: Vec<FriendsResponse>
}