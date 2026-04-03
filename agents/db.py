from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from agents.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_size=2,
    pool_pre_ping=True,
    execution_options={"postgresql_readonly": True},
)

SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True)
    clerkId = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    firstName = Column(String)
    lastName = Column(String)
    imageUrl = Column(String)
    tenantId = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)


class DebateSession(Base):
    __tablename__ = "DebateSession"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id"))
    topic = Column(Text)
    status = Column(String)
    modelsUsed = Column(JSON)
    totalCost = Column(Float)
    goldenPrompt = Column(Text)
    mode = Column(String)
    estimatedCost = Column(Float)
    debateSource = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)


class Agent(Base):
    __tablename__ = "Agent"

    id = Column(String, primary_key=True)
    name = Column(String)
    provider = Column(String)
    modelId = Column(String)
    description = Column(String)
    isActive = Column(Boolean, default=True)
    tenantId = Column(String)
    userId = Column(String, ForeignKey("User.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)


class UsageRecord(Base):
    __tablename__ = "UsageRecord"

    id = Column(String, primary_key=True)
    tenantId = Column(String)
    agentId = Column(String)
    tokens = Column(Integer)
    cost = Column(Float)
    recordedAt = Column(DateTime, default=datetime.utcnow)


class AgentFailure(Base):
    __tablename__ = "AgentFailure"

    id = Column(String, primary_key=True)
    modelId = Column(String)
    provider = Column(String)
    errorType = Column(String)
    debateId = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)


def get_session() -> Session:
    return SessionLocal()


def find_user_by_email(email: str) -> User | None:
    with SessionLocal() as session:
        return session.query(User).filter(User.email == email).first()


def find_user_by_id(user_id: str) -> User | None:
    with SessionLocal() as session:
        return session.query(User).filter(User.id == user_id).first()
