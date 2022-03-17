docker rm --force FastAPI_Qwirkle
docker build -t fastapi_qwirkle .
docker run -dp 63551:63551 --name FastAPI_Qwirkle fastapi_qwirkle