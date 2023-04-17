# how to use;
### create user 
```
curl --request POST \
  --url http://127.0.0.1:8081/user/register \
  --header 'Content-Type: application/json' \
  --data '{
  "username": "abc",
  "password": "osaka"
}'
```
### run realtime server
```
~/realtime> mix deps.get
~/realtime> mix phx.server
```
### run api server
```
~/api> cargo run
```
### run client server
```
~/client> npm i
~/client> npm run dev
```