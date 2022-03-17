import sys, json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from fastapi.encoders import jsonable_encoder

app = FastAPI(docs_url="/abcde", redoc_url=None)

cors_origins = [
    "http://bymariie.github.io"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],#cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ContenuPartie(BaseModel):
    plateau_jeu: dict
    tab_joueurs: list
    joueurActif: int
    partie_id: str
    sac_pions: list
    partieCommencee: bool

PARTIES = {}

@app.get("/chargerpartie/{partie_id}")
async def chargerpartie(partie_id:str):
    return PARTIES[partie_id]

@app.post("/sauvegarder")
async def sauvegarder(json_data: ContenuPartie):
    json_compatible_item_data = jsonable_encoder(json_data)
    PARTIES[json_data.partie_id] = json_compatible_item_data
    return "OK"

@app.get("/touteslesparties/")
async def touteslesparties():
    return PARTIES

@app.get("/supprimerparties/")
async def supprimerparties():
    PARTIES = {}
    return "OK"









