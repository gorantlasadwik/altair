from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))

class QuizScore(Base):
    __tablename__ = "quiz_scores"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), index=True)
    score = Column(Integer)
    questions_count = Column(Integer)
    difficulty = Column(String(20))
    time_limit = Column(Integer)
    created_at = Column(String(50))
