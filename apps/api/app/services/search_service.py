from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, text
from app.models.page import Page, Block
from app.models.database import DatabaseModel, DatabaseRow, DatabaseCell
from app.schemas.search import SearchResponse, SearchResultItem
from typing import List

class SearchService:
    @staticmethod
    async def search(db: AsyncSession, workspace_id: str, query: str) -> SearchResponse:
        if not query or not query.strip():
            # Return recent pages
            stmt = select(Page).where(
                Page.workspace_id == workspace_id,
                Page.is_archived == False
            ).order_by(Page.updated_at.desc()).limit(10)
            res = await db.execute(stmt)
            pages = res.scalars().all()
            items = [
                SearchResultItem(
                    id=p.id,
                    type="page",
                    title=p.title or "Untitled",
                    subtitle="Recent page",
                    icon=p.icon or "📄",
                    url=f"/p/{p.id}",
                    highlights="Recently updated",
                    score=1.0
                )
                for p in pages
            ]
            return SearchResponse(query="", total=len(items), results=items)

        q_clean = query.strip().lower()
        search_pattern = f"%{q_clean}%"
        results: List[SearchResultItem] = []

        # 1. Search Pages by title
        page_stmt = select(Page).where(
            Page.workspace_id == workspace_id,
            Page.is_archived == False,
            Page.title.ilike(search_pattern)
        ).limit(10)
        p_res = await db.execute(page_stmt)
        for p in p_res.scalars().all():
            results.append(SearchResultItem(
                id=p.id,
                type="page",
                title=p.title,
                subtitle="Page Title Match",
                icon=p.icon or "📄",
                url=f"/p/{p.id}",
                highlights=f"Matched title: {p.title}",
                score=2.0
            ))

        # 2. Search Blocks content
        block_stmt = select(Block, Page).join(Page, Block.page_id == Page.id).where(
            Page.workspace_id == workspace_id,
            Page.is_archived == False,
            # Search within text content json
            or_(
                Block.content.cast(text("TEXT")).ilike(search_pattern)
            )
        ).limit(15)
        b_res = await db.execute(block_stmt)
        for b, p in b_res.all():
            block_text = b.content.get("text", "") if isinstance(b.content, dict) else str(b.content)
            results.append(SearchResultItem(
                id=b.id,
                type="block",
                title=p.title,
                subtitle=f"Block inside {p.title}",
                icon="📝",
                url=f"/p/{p.id}#{b.id}",
                highlights=block_text[:120] if block_text else "Content match",
                score=1.5
            ))

        # 3. Search Databases
        db_stmt = select(DatabaseModel).where(
            DatabaseModel.workspace_id == workspace_id,
            DatabaseModel.name.ilike(search_pattern)
        ).limit(5)
        d_res = await db.execute(db_stmt)
        for d in d_res.scalars().all():
            results.append(SearchResultItem(
                id=d.id,
                type="database",
                title=d.name,
                subtitle="Database",
                icon=d.icon or "📊",
                url=f"/d/{d.id}",
                highlights=d.description or "Database collection",
                score=1.8
            ))

        return SearchResponse(query=query, total=len(results), results=results)
