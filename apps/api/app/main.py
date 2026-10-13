from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.session import engine
from app.models.base import Base
from app.api.v1.endpoints.auth import auth_router, workspace_router
from app.api.v1.endpoints.pages import pages_router, blocks_router
from app.api.v1.endpoints.databases import databases_router
from app.api.v1.endpoints.search import search_router, ai_router, health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables in local database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(workspace_router, prefix=api_prefix)
app.include_router(pages_router, prefix=api_prefix)
app.include_router(blocks_router, prefix=api_prefix)
app.include_router(databases_router, prefix=api_prefix)
app.include_router(search_router, prefix=api_prefix)
app.include_router(ai_router, prefix=api_prefix)
app.include_router(health_router, prefix=api_prefix)

@app.get("/")
async def root():
    return {
        "name": "NEXUS Core API",
        "status": "online",
        "docs": "/docs",
        "version": settings.VERSION
    }
