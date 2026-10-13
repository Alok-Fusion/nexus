from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse
from app.services.auth_service import AuthService, WorkspaceService
from app.api.v1.dependencies import get_current_user
from app.models.user import User

auth_router = APIRouter(prefix="/auth", tags=["auth"])
workspace_router = APIRouter(prefix="/workspaces", tags=["workspaces"])

@auth_router.post("/register")
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    return await AuthService.register(db, data)

@auth_router.post("/login")
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    return await AuthService.login(db, data)

@auth_router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@workspace_router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await WorkspaceService.get_user_workspaces(db, current_user.id)

@workspace_router.post("", response_model=WorkspaceResponse)
async def create_workspace(
    data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await WorkspaceService.create_workspace(db, current_user.id, data)
