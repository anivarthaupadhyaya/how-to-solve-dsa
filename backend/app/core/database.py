"""SQLAlchemy database engine, session management, and Base model."""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.core.config import settings


class Base(DeclarativeBase):
    """Declarative Base class for all SQLAlchemy ORM models."""
    pass


# pool_pre_ping checks connection health before issuing queries
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """Provide a transactional database session scope for FastAPI dependencies."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
