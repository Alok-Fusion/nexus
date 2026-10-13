from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings
import os

# Ensure data directory exists for SQLite
if "sqlite" in settings.DATABASE_URL:
    db_path = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
