from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.page import (
    PageCreate, PageUpdate, PageDetailResponse, PageTreeItem,
    BlockCreate, BlockUpdate, BlockResponse
)
from app.services.page_service import PageService, BlockService
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from typing import List, Optional

pages_router = APIRouter(prefix="/pages", tags=["pages"])
blocks_router = APIRouter(prefix="/blocks", tags=["blocks"])

@pages_router.get("/workspace/{workspace_id}", response_model=List[PageTreeItem])
async def get_workspace_pages(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await PageService.get_workspace_tree(db, workspace_id)

@pages_router.get("/{page_id}", response_model=PageDetailResponse)
async def get_page(
    page_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await PageService.get_page_detail(db, page_id)

@pages_router.post("/workspace/{workspace_id}", response_model=PageDetailResponse)
async def create_page(
    workspace_id: str,
    data: PageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await PageService.create_page(db, workspace_id, data)

@pages_router.patch("/{page_id}")
async def update_page(
    page_id: str,
    data: PageUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await PageService.update_page(db, page_id, data)

@pages_router.delete("/{page_id}")
async def delete_page(
    page_id: str,
    soft: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await PageService.delete_page(db, page_id, soft)

@blocks_router.post("/page/{page_id}", response_model=BlockResponse)
async def create_block(
    page_id: str,
    data: BlockCreate,
    prev_pos: Optional[str] = Query(None),
    next_pos: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await BlockService.create_block(db, page_id, data, prev_pos, next_pos)

@blocks_router.patch("/{block_id}", response_model=BlockResponse)
async def update_block(
    block_id: str,
    data: BlockUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await BlockService.update_block(db, block_id, data)

@blocks_router.delete("/{block_id}")
async def delete_block(
    block_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await BlockService.delete_block(db, block_id)

@blocks_router.post("/page/{page_id}/batch-sync")
async def batch_sync(
    page_id: str,
    blocks: List[dict],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await BlockService.batch_sync_blocks(db, page_id, blocks)
