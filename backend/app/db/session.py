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

    # For PostgreSQL, ensure sslmode=require is passed to psycopg2
    connect_args = {}
    if "postgresql" in url:
        connect_args["sslmode"] = "require"

    return create_engine(
        url,
        connect_args=connect_args,
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
