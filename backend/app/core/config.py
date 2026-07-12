import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusGPT API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    DEBUG: bool = False

    DATABASE_URL: Optional[str] = None
    SQLITE_DB_PATH: str = "campusgpt.db"

    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    JWT_SECRET: str = "supersecretcampusgptkeychangeinproduction"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    AI_PROVIDER: str = "gemini"

    OLLAMA_API_BASE: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    GEMINI_API_KEY: Optional[str] = None

    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    CHROMA_PERSIST_DIR: str = "chroma_db"
    EMBEDDING_MODEL: str = "nomic-embed-text"
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64
    RAG_TOP_K: int = 5
    UPLOAD_DIR: str = "uploads"

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"sqlite:///./{self.SQLITE_DB_PATH}"

    @property
    def cors_origins_list(self) -> list:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
