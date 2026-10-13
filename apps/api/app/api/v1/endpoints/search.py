from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.search import SearchResponse
from app.schemas.ai import AIChatRequest, AIChatResponse, AIStatusResponse
from app.services.search_service import SearchService
from app.services.ai_service import AIService
from app.api.v1.dependencies import get_current_user
from app.models.user import User

search_router = APIRouter(prefix="/search", tags=["search"])
ai_router = APIRouter(prefix="/ai", tags=["ai"])
health_router = APIRouter(prefix="/health", tags=["health"])

@search_router.get("/workspace/{workspace_id}", response_model=SearchResponse)
async def search_workspace(
    workspace_id: str,
    q: str = Query("", alias="q"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await SearchService.search(db, workspace_id, q)

@ai_router.get("/status", response_model=AIStatusResponse)
async def get_ai_status(current_user: User = Depends(get_current_user)):
    return await AIService.get_status()

@ai_router.post("/chat/workspace/{workspace_id}", response_model=AIChatResponse)
async def chat_with_ai(
    workspace_id: str,
    request: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AIService.chat(db, workspace_id, request)

@health_router.get("")
async def system_health():
    ai_status = await AIService.get_status()
    return {
        "status": "healthy",
        "app": "NEXUS",
        "version": "0.1.0",
        "local_storage": "online",
        "ai_engine": ai_status.status
    }
