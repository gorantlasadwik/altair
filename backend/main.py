from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

import os
import urllib.request
import json
import time
from datetime import datetime

import sys
import os

# Add the backend directory to sys.path to allow imports in Vercel's environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import models
import auth
from database import engine, get_db

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS so the Vite frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# Simple memory cache for external APIs
cache = {
    "launches": {"data": None, "timestamp": 0},
    "asteroids": {"data": None, "timestamp": 0}
}
CACHE_TTL = 900 # 15 minutes

@app.get("/api/launches")
def get_launches():
    current_time = time.time()
    if cache["launches"]["data"] and (current_time - cache["launches"]["timestamp"] < CACHE_TTL):
        return cache["launches"]["data"]
        
    try:
        req = urllib.request.Request(
            "https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=4",
            headers={'User-Agent': 'ALTAIR-Dashboard/1.0'}
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            cache["launches"]["data"] = data
            cache["launches"]["timestamp"] = current_time
            return data
    except Exception as e:
        if cache["launches"]["data"]:
            return cache["launches"]["data"]
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nasa/asteroids")
def get_asteroids():
    current_time = time.time()
    if cache["asteroids"]["data"] and (current_time - cache["asteroids"]["timestamp"] < CACHE_TTL):
        return cache["asteroids"]["data"]

    api_key = os.getenv("NASA_API_KEY", "DEMO_KEY")
    today = datetime.utcnow().strftime('%Y-%m-%d')
    url = f"https://api.nasa.gov/neo/rest/v1/feed?start_date={today}&end_date={today}&api_key={api_key}"
    
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            cache["asteroids"]["data"] = data
            cache["asteroids"]["timestamp"] = current_time
            return data
    except Exception as e:
        if cache["asteroids"]["data"]:
            return cache["asteroids"]["data"]
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/nasa/apod")
def get_nasa_apod():
    api_key = os.getenv("NASA_API_KEY", "DEMO_KEY")
    url = f"https://api.nasa.gov/planetary/apod?api_key={api_key}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
