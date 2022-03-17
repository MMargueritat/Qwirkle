import uvicorn

if __name__ == '__main__':
    uvicorn.run("app.main:app",
                host="0.0.0.0",
                port=63551,
                reload=True,
                ssl_keyfile="/mnt/user/appdata/swag/keys/letsencrypt/privkey.pem",
                ssl_certfile="/mnt/user/appdata/swag/keys/letsencrypt/fullchain.pem"                
                )