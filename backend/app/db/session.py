from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings


def _build_engine():
    url = settings.get_database_url

    if "sqlite" in url:
        return create_engine(
            url,
            connect_args={"check_same_thread": False}
        )

    # PostgreSQL via Supabase pooler
    # Use pg8000 (pure Python) — works on Render free tier (IPv4 only)
    # Swap dialect to postgresql+pg8000 and ensure sslmode=require
    if "postgresql://" in url and "+pg8000" not in url:
        url = url.replace("postgresql://", "postgresql+pg8000://", 1)

    # Add sslmode=require if not already present
    if "sslmode" not in url:
        url += "?sslmode=require"

    return create_engine(
        url,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
    )


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
