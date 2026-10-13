from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.database import (
    DatabaseCreate, DatabasePropertyCreate, DatabasePropertyUpdate,
    DatabaseRowCreate, DatabaseCellUpdate, DatabaseDetailResponse
)
from app.services.database_service import DatabaseService
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from typing import List, Any

databases_router = APIRouter(prefix="/databases", tags=["databases"])

@databases_router.get("/workspace/{workspace_id}")
async def list_workspace_databases(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DatabaseService.get_workspace_databases(db, workspace_id)

@databases_router.get("/{database_id}")
async def get_database(
    database_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DatabaseService.get_database_detail(db, database_id)

@databases_router.post("/workspace/{workspace_id}")
async def create_database(
    workspace_id: str,
    data: DatabaseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DatabaseService.create_database(db, workspace_id, data)

@databases_router.post("/{database_id}/properties")
async def add_property(
    database_id: str,
    data: DatabasePropertyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DatabaseService.add_property(db, database_id, data)

@databases_router.post("/{database_id}/rows")
async def create_row(
    database_id: str,
    data: DatabaseRowCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DatabaseService.create_row(db, database_id, data)

@databases_router.patch("/rows/{row_id}/cells")
async def update_cell(
    row_id: str,
    data: DatabaseCellUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DatabaseService.update_cell(db, row_id, data.property_id, data.value)

@databases_router.delete("/rows/{row_id}")
async def delete_row(
    row_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await DatabaseService.delete_row(db, row_id)
