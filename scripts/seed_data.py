import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../apps/api")))

from app.db.session import async_session_maker, engine
from app.models.base import Base
from app.models.user import User, Workspace, WorkspaceMember
from app.models.page import Page, Block
from app.models.database import DatabaseModel, DatabaseProperty, DatabaseView, DatabaseRow, DatabaseCell
from app.core.security import get_password_hash

async def seed():
    print("[+] Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as db:
        # Check if already seeded
        from sqlalchemy import select
        res = await db.execute(select(User).where(User.email == "alex@nexus.local"))
        if res.scalar_one_or_none():
            print("[✓] Database already seeded.")
            return

        print("[+] Creating default user and workspace...")
        user = User(
            email="alex@nexus.local",
            hashed_password=get_password_hash("nexus123"),
            full_name="Alex Mercer"
        )
        db.add(user)
        await db.flush()

        workspace = Workspace(
            name="NEXUS Master Workspace",
            slug="nexus-master",
            icon="⚡",
            description="The central intelligence and productivity workspace.",
            owner_id=user.id
        )
        db.add(workspace)
        await db.flush()

        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role="OWNER"
        )
        db.add(member)
        await db.flush()

        # Page 1: Welcome Page
        p1 = Page(
            workspace_id=workspace.id,
            title="Getting Started with NEXUS",
            icon="🚀",
            is_favorite=True,
            position="a0"
        )
        db.add(p1)
        await db.flush()

        blocks_p1 = [
            Block(page_id=p1.id, type="heading_1", position="a0", content={"text": "Welcome to NEXUS"}, properties={}),
            Block(page_id=p1.id, type="paragraph", position="a1", content={"text": "NEXUS is your sovereign, local-first AI-native workspace. Everything you see here lives on your local machine with zero external cloud dependencies."}, properties={}),
            Block(page_id=p1.id, type="callout", position="a2", content={"text": "💡 Tip: Press Cmd/Ctrl + K anytime to open the universal Command Center, or press '/' inside any document to insert blocks."}, properties={"color": "accent"}),
            Block(page_id=p1.id, type="heading_2", position="a3", content={"text": "Core Principles"}, properties={}),
            Block(page_id=p1.id, type="todo", position="a4", content={"text": "100% Local-First Data Sovereignty"}, properties={"checked": True}),
            Block(page_id=p1.id, type="todo", position="a5", content={"text": "Sub-50ms Keyboard-Driven Performance"}, properties={"checked": True}),
            Block(page_id=p1.id, type="todo", position="a6", content={"text": "Fractional Base-62 Block Ordering"}, properties={"checked": True}),
            Block(page_id=p1.id, type="todo", position="a7", content={"text": "Local Hybrid Search & Agnostic AI Runtimes"}, properties={"checked": True}),
        ]
        for b in blocks_p1:
            db.add(b)

        # Page 2: Knowledge Base
        p2 = Page(
            workspace_id=workspace.id,
            title="Machine Learning & System Architecture",
            icon="🧠",
            is_favorite=True,
            position="a1"
        )
        db.add(p2)
        await db.flush()

        blocks_p2 = [
            Block(page_id=p2.id, type="heading_1", position="a0", content={"text": "Local AI & Vector Foundations"}, properties={}),
            Block(page_id=p2.id, type="paragraph", position="a1", content={"text": "Running inference on host silicon requires strict memory management and quantized weights."}, properties={}),
            Block(page_id=p2.id, type="code", position="a2", content={"text": "# Local Hybrid Query Flow\ndef hybrid_search(query: str, top_k: int = 10):\n    fts_results = postgres_tsquery(query)\n    trigram_results = fuzzy_trgm_match(query)\n    return reciprocal_rank_fusion(fts_results, trigram_results)"}, properties={"language": "python"}),
            Block(page_id=p2.id, type="quote", position="a3", content={"text": "Software sovereignty begins when the user owns the persistence and the computation layer."}, properties={}),
        ]
        for b in blocks_p2:
            db.add(b)

        # Database: Sprint Roadmap
        db_model = DatabaseModel(
            workspace_id=workspace.id,
            name="Sprint & Project Roadmap",
            icon="🎯",
            description="Active milestones and development tracking."
        )
        db.add(db_model)
        await db.flush()

        prop_title = DatabaseProperty(database_id=db_model.id, name="Task Name", type="title", position="a0")
        prop_status = DatabaseProperty(database_id=db_model.id, name="Status", type="status", position="a1", config={
            "options": [
                {"id": "todo", "name": "To Do", "color": "slate"},
                {"id": "in_progress", "name": "In Progress", "color": "blue"},
                {"id": "done", "name": "Done", "color": "emerald"}
            ]
        })
        prop_priority = DatabaseProperty(database_id=db_model.id, name="Priority", type="select", position="a2", config={
            "options": [
                {"id": "low", "name": "Low", "color": "slate"},
                {"id": "medium", "name": "Medium", "color": "amber"},
                {"id": "high", "name": "High", "color": "rose"}
            ]
        })
        prop_date = DatabaseProperty(database_id=db_model.id, name="Target Date", type="date", position="a3")
        
        db.add_all([prop_title, prop_status, prop_priority, prop_date])
        await db.flush()

        # Views
        v_table = DatabaseView(database_id=db_model.id, name="Table View", type="table", filters=[], sorts=[], config={})
        v_board = DatabaseView(database_id=db_model.id, name="Kanban Board", type="board", filters=[], sorts=[], config={"groupByPropertyId": prop_status.id})
        db.add_all([v_table, v_board])
        await db.flush()

        # Rows
        sample_tasks = [
            ("Build Block Fractional Indexing Engine", "done", "high", "2026-09-10"),
            ("Implement Multi-View Kanban Database", "done", "high", "2026-09-12"),
            ("Integrate Local Hybrid Full-Text Search", "in_progress", "high", "2026-09-15"),
            ("Connect Local AI Provider & Safety Validation", "in_progress", "medium", "2026-09-18"),
            ("Design Keyboard-First Command Palette", "done", "medium", "2026-09-20"),
        ]

        for i, (title, status, priority, date_val) in enumerate(sample_tasks):
            r = DatabaseRow(database_id=db_model.id, position=f"a{i}")
            db.add(r)
            await db.flush()

            c1 = DatabaseCell(row_id=r.id, property_id=prop_title.id, value=title)
            c2 = DatabaseCell(row_id=r.id, property_id=prop_status.id, value=status)
            c3 = DatabaseCell(row_id=r.id, property_id=prop_priority.id, value=priority)
            c4 = DatabaseCell(row_id=r.id, property_id=prop_date.id, value=date_val)
            db.add_all([c1, c2, c3, c4])

        await db.commit()
        print("[+] Successfully seeded NEXUS Master Workspace!")

if __name__ == "__main__":
    asyncio.run(seed())
