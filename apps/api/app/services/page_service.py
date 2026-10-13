from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from fastapi import HTTPException
from app.models.page import Page, Block
from app.schemas.page import PageCreate, PageUpdate, BlockCreate, BlockUpdate
from app.services.fractional_index import generate_key_between
from typing import List, Optional

class PageService:
    @staticmethod
    async def get_workspace_tree(db: AsyncSession, workspace_id: str):
        stmt = select(Page).where(
            Page.workspace_id == workspace_id,
            Page.is_archived == False
        ).order_by(Page.position)
        res = await db.execute(stmt)
        pages = res.scalars().all()
        
        # Build hierarchy tree
        page_dict = {p.id: {
            "id": p.id,
            "parent_id": p.parent_id,
            "title": p.title,
            "icon": p.icon,
            "is_favorite": p.is_favorite,
            "is_archived": p.is_archived,
            "position": p.position,
            "updated_at": p.updated_at,
            "children": []
        } for p in pages}
        
        root_nodes = []
        for p in pages:
            node = page_dict[p.id]
            if p.parent_id and p.parent_id in page_dict:
                page_dict[p.parent_id]["children"].append(node)
            else:
                root_nodes.append(node)
                
        return root_nodes

    @staticmethod
    async def get_page_detail(db: AsyncSession, page_id: str):
        stmt = select(Page).where(Page.id == page_id)
        res = await db.execute(stmt)
        page = res.scalar_one_or_none()
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        
        # Get blocks
        stmt_blocks = select(Block).where(Block.page_id == page_id).order_by(Block.position)
        b_res = await db.execute(stmt_blocks)
        blocks = b_res.scalars().all()
        
        page.blocks = blocks
        return page

    @staticmethod
    async def create_page(db: AsyncSession, workspace_id: str, data: PageCreate):
        # Calculate position
        stmt_last = select(Page.position).where(
            Page.workspace_id == workspace_id,
            Page.parent_id == data.parent_id
        ).order_by(Page.position.desc()).limit(1)
        last_pos = (await db.execute(stmt_last)).scalar_one_or_none()
        pos = data.position or generate_key_between(last_pos, None)

        page = Page(
            workspace_id=workspace_id,
            parent_id=data.parent_id,
            title=data.title,
            icon=data.icon or "📄",
            cover_url=data.cover_url,
            position=pos
        )
        db.add(page)
        await db.flush()

        # Create initial paragraph block
        block = Block(
            page_id=page.id,
            type="paragraph",
            position="a0",
            content={"text": ""},
            properties={}
        )
        db.add(block)
        await db.commit()
        await db.refresh(page)
        page.blocks = [block]
        return page

    @staticmethod
    async def update_page(db: AsyncSession, page_id: str, data: PageUpdate):
        stmt = select(Page).where(Page.id == page_id)
        page = (await db.execute(stmt)).scalar_one_or_none()
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(page, k, v)
            
        await db.commit()
        await db.refresh(page)
        return page

    @staticmethod
    async def delete_page(db: AsyncSession, page_id: str, soft_delete: bool = True):
        stmt = select(Page).where(Page.id == page_id)
        page = (await db.execute(stmt)).scalar_one_or_none()
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        
        if soft_delete:
            page.is_archived = True
            await db.commit()
        else:
            await db.delete(page)
            await db.commit()
        return {"status": "success", "id": page_id}


class BlockService:
    @staticmethod
    async def create_block(db: AsyncSession, page_id: str, data: BlockCreate, prev_pos: Optional[str] = None, next_pos: Optional[str] = None):
        pos = data.position or generate_key_between(prev_pos, next_pos)
        block = Block(
            id=data.id or None,
            page_id=page_id,
            parent_id=data.parent_id,
            type=data.type,
            position=pos,
            content=data.content or {},
            properties=data.properties or {}
        )
        db.add(block)
        await db.commit()
        await db.refresh(block)
        return block

    @staticmethod
    async def update_block(db: AsyncSession, block_id: str, data: BlockUpdate):
        stmt = select(Block).where(Block.id == block_id)
        block = (await db.execute(stmt)).scalar_one_or_none()
        if not block:
            raise HTTPException(status_code=404, detail="Block not found")
        
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(block, k, v)
            
        await db.commit()
        await db.refresh(block)
        return block

    @staticmethod
    async def delete_block(db: AsyncSession, block_id: str):
        stmt = select(Block).where(Block.id == block_id)
        block = (await db.execute(stmt)).scalar_one_or_none()
        if not block:
            raise HTTPException(status_code=404, detail="Block not found")
        
        await db.delete(block)
        await db.commit()
        return {"status": "deleted", "id": block_id}

    @staticmethod
    async def batch_sync_blocks(db: AsyncSession, page_id: str, blocks_data: List[dict]):
        """
        Batch update/insert blocks for high performance synchronization.
        """
        for b in blocks_data:
            b_id = b.get("id")
            if b_id:
                stmt = select(Block).where(Block.id == b_id)
                existing = (await db.execute(stmt)).scalar_one_or_none()
                if existing:
                    existing.type = b.get("type", existing.type)
                    existing.position = b.get("position", existing.position)
                    existing.content = b.get("content", existing.content)
                    existing.properties = b.get("properties", existing.properties)
                    existing.parent_id = b.get("parent_id", existing.parent_id)
                    continue

            new_block = Block(
                id=b.get("id"),
                page_id=page_id,
                parent_id=b.get("parent_id"),
                type=b.get("type", "paragraph"),
                position=b.get("position", "a0"),
                content=b.get("content", {}),
                properties=b.get("properties", {})
            )
            db.add(new_block)
            
        await db.commit()
        return {"status": "synced", "count": len(blocks_data)}
