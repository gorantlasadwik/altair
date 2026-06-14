from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import Request
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from groq import Groq

import os
import urllib.request
import json
import time
from datetime import datetime
from jose import JWTError, jwt

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

class QuizScoreSubmit(BaseModel):
    score: int
    questions_count: int
    difficulty: str
    time_limit: int

@app.post("/api/quiz/score")
def submit_quiz_score(score_data: QuizScoreSubmit, db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    db_score = models.QuizScore(
        username=username,
        score=score_data.score,
        questions_count=score_data.questions_count,
        difficulty=score_data.difficulty,
        time_limit=score_data.time_limit,
        created_at=datetime.utcnow().isoformat()
    )
    db.add(db_score)
    db.commit()
    db.refresh(db_score)
    return {"status": "success", "score_id": db_score.id}

@app.get("/api/quiz/leaderboard")
def get_quiz_leaderboard(db: Session = Depends(get_db)):
    scores = db.query(models.QuizScore).order_by(models.QuizScore.score.desc()).limit(10).all()
    return scores

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




@app.get("/api/nasa/astros")
def get_astros():
    try:
        req = urllib.request.Request(
            "https://lldev.thespacedevs.com/2.2.0/astronaut/?in_space=true",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
def chat_with_bot(req: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is missing in environment variables.")
    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are ALTAIR's advanced research AI assistant. You provide highly accurate, concise information about space, astronomy, physics, and aerospace engineering. Format your response beautifully using Markdown with clear paragraphs or lists."
                },
                {
                    "role": "user",
                    "content": req.message
                }
            ],
            model="llama-3.1-8b-instant",
            max_tokens=1500
        )
        return {"response": chat_completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# SERVE STATIC FILES (FRONTEND)
# ==========================================
dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")

if os.path.exists(dist_dir):
    curiosity_next_dir = os.path.join(dist_dir, "curiosity", "_next")
    if os.path.exists(curiosity_next_dir):
        # Route /_next to the same folder for NextJS static assets
        app.mount("/_next", StaticFiles(directory=curiosity_next_dir), name="next_assets")

    # Serve all other static files
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")

    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc: HTTPException):
        # Fallback to index.html for SPA routing
        index_path = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"detail": "Not Found"}
