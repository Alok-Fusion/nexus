from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "NEXUS API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Secret key for local JWT tokens
    SECRET_KEY: str = "nexus-local-sovereignty-secret-key-change-in-prod-123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days local session
    
    # Database: Defaults to local SQLite async for instant zero-dependency local startup, or PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///../../data/nexus.db")
    
    # Local File Storage Paths
    DATA_DIR: str = os.getenv("DATA_DIR", "../../data")
    UPLOADS_DIR: str = os.getenv("UPLOADS_DIR", "../../data/uploads")
    BACKUPS_DIR: str = os.getenv("BACKUPS_DIR", "../../data/backups")
    EXPORTS_DIR: str = os.getenv("EXPORTS_DIR", "../../data/exports")
    
    # Local AI Settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    LOCAL_LLM_MODEL: str = os.getenv("LOCAL_LLM_MODEL", "llama3:8b")
    LOCAL_EMBEDDING_MODEL: str = os.getenv("LOCAL_EMBEDDING_MODEL", "nomic-embed-text")
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
