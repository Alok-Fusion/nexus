from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from fastapi import HTTPException
from app.models.database import DatabaseModel, DatabaseProperty, DatabaseView, DatabaseRow, DatabaseCell
from app.schemas.database import (
    DatabaseCreate, DatabasePropertyCreate, DatabasePropertyUpdate,
    DatabaseViewCreate, DatabaseRowCreate, DatabaseCellUpdate
)
from app.services.fractional_index import generate_key_between
from typing import List, Dict, Any, Optional

class DatabaseService:
    @staticmethod
    async def get_workspace_databases(db: AsyncSession, workspace_id: str):
        stmt = select(DatabaseModel).where(DatabaseModel.workspace_id == workspace_id).order_by(DatabaseModel.created_at.desc())
        res = await db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    async def get_database_detail(db: AsyncSession, database_id: str):
        stmt = select(DatabaseModel).where(DatabaseModel.id == database_id)
        res = await db.execute(stmt)
        database = res.scalar_one_or_none()
        if not database:
            raise HTTPException(status_code=404, detail="Database not found")

        # Load properties
        p_stmt = select(DatabaseProperty).where(DatabaseProperty.database_id == database_id).order_by(DatabaseProperty.position)
        database.properties = (await db.execute(p_stmt)).scalars().all()

        # Load views
        v_stmt = select(DatabaseView).where(DatabaseView.database_id == database_id)
        database.views = (await db.execute(v_stmt)).scalars().all()

        # Load rows with cells
        r_stmt = select(DatabaseRow).where(DatabaseRow.database_id == database_id).order_by(DatabaseRow.position)
        rows = (await db.execute(r_stmt)).scalars().all()

        # Format rows with cells as property_id -> value dict
        formatted_rows = []
        for r in rows:
            c_stmt = select(DatabaseCell).where(DatabaseCell.row_id == r.id)
            cells = (await db.execute(c_stmt)).scalars().all()
            cell_dict = {c.property_id: c.value for c in cells}
            formatted_rows.append({
                "id": r.id,
                "database_id": r.database_id,
                "position": r.position,
                "cells": cell_dict,
                "created_at": r.created_at,
                "updated_at": r.updated_at
            })
            
        return {
            "id": database.id,
            "workspace_id": database.workspace_id,
            "page_id": database.page_id,
            "name": database.name,
            "icon": database.icon,
            "description": database.description,
            "properties": database.properties,
            "views": database.views,
            "rows": formatted_rows,
            "created_at": database.created_at,
            "updated_at": database.updated_at
        }

    @staticmethod
    async def create_database(db: AsyncSession, workspace_id: str, data: DatabaseCreate):
        database = DatabaseModel(
            workspace_id=workspace_id,
            page_id=data.page_id,
            name=data.name,
            icon=data.icon or "📊",
            description=data.description
        )
        db.add(database)
        await db.flush()

        # Create default properties if not specified
        props_to_create = data.initial_properties or [
            DatabasePropertyCreate(name="Name", type="title", position="a0"),
            DatabasePropertyCreate(name="Status", type="status", position="a1", config={
                "options": [
                    {"id": "todo", "name": "To Do", "color": "slate"},
                    {"id": "in_progress", "name": "In Progress", "color": "blue"},
                    {"id": "done", "name": "Done", "color": "emerald"}
                ]
            }),
            DatabasePropertyCreate(name="Priority", type="select", position="a2", config={
                "options": [
                    {"id": "low", "name": "Low", "color": "slate"},
                    {"id": "medium", "name": "Medium", "color": "amber"},
                    {"id": "high", "name": "High", "color": "rose"}
                ]
            }),
            DatabasePropertyCreate(name="Due Date", type="date", position="a3")
        ]

        created_props = []
        for p in props_to_create:
            prop = DatabaseProperty(
                database_id=database.id,
                name=p.name,
                type=p.type,
                position=p.position or "a0",
                config=p.config
            )
            db.add(prop)
            created_props.append(prop)
        await db.flush()

        # Create default Table and Board views
        view_table = DatabaseView(
            database_id=database.id,
            name="Table View",
            type="table",
            filters=[],
            sorts=[],
            config={}
        )
        view_board = DatabaseView(
            database_id=database.id,
            name="Kanban Board",
            type="board",
            filters=[],
            sorts=[],
            config={"groupByPropertyId": created_props[1].id if len(created_props) > 1 else None}
        )
        db.add(view_table)
        db.add(view_board)
        await db.commit()
        await db.refresh(database)
        
        return await DatabaseService.get_database_detail(db, database.id)

    @staticmethod
    async def add_property(db: AsyncSession, database_id: str, data: DatabasePropertyCreate):
        stmt_last = select(DatabaseProperty.position).where(DatabaseProperty.database_id == database_id).order_by(DatabaseProperty.position.desc()).limit(1)
        last_pos = (await db.execute(stmt_last)).scalar_one_or_none()
        pos = data.position or generate_key_between(last_pos, None)

        prop = DatabaseProperty(
            database_id=database_id,
            name=data.name,
            type=data.type,
            position=pos,
            config=data.config
        )
        db.add(prop)
        await db.commit()
        await db.refresh(prop)
        return prop

    @staticmethod
    async def create_row(db: AsyncSession, database_id: str, data: DatabaseRowCreate):
        stmt_last = select(DatabaseRow.position).where(DatabaseRow.database_id == database_id).order_by(DatabaseRow.position.desc()).limit(1)
        last_pos = (await db.execute(stmt_last)).scalar_one_or_none()
        pos = data.position or generate_key_between(last_pos, None)

        row = DatabaseRow(
            database_id=database_id,
            position=pos
        )
        db.add(row)
        await db.flush()

        # Add cells
        for prop_id, val in data.cells.items():
            cell = DatabaseCell(
                row_id=row.id,
                property_id=prop_id,
                value=val
            )
            db.add(cell)

        await db.commit()
        await db.refresh(row)
        
        return {
            "id": row.id,
            "database_id": row.database_id,
            "position": row.position,
            "cells": data.cells,
            "created_at": row.created_at,
            "updated_at": row.updated_at
        }

    @staticmethod
    async def update_cell(db: AsyncSession, row_id: str, property_id: str, value: Any):
        stmt = select(DatabaseCell).where(
            DatabaseCell.row_id == row_id,
            DatabaseCell.property_id == property_id
        )
        cell = (await db.execute(stmt)).scalar_one_or_none()
        if cell:
            cell.value = value
        else:
            cell = DatabaseCell(
                row_id=row_id,
                property_id=property_id,
                value=value
            )
            db.add(cell)

        await db.commit()
        return {"status": "success", "row_id": row_id, "property_id": property_id, "value": value}

    @staticmethod
    async def delete_row(db: AsyncSession, row_id: str):
        stmt = select(DatabaseRow).where(DatabaseRow.id == row_id)
        row = (await db.execute(stmt)).scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Row not found")
        await db.delete(row)
        await db.commit()
        return {"status": "deleted", "id": row_id}
