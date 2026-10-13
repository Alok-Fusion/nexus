from sqlalchemy import String, DateTime, ForeignKey, Boolean, Text, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, Any, Dict
from datetime import datetime
from app.models.base import Base, generate_uuid, utc_now

class DatabaseModel(Base):
    __tablename__ = "databases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id"), nullable=False)
    page_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("pages.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), default="Untitled Database")
    icon: Mapped[Optional[str]] = mapped_column(String(64), default="📊")
    description: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="databases")
    properties: Mapped[List["DatabaseProperty"]] = relationship("DatabaseProperty", back_populates="database", cascade="all, delete-orphan", order_by="DatabaseProperty.position")
    views: Mapped[List["DatabaseView"]] = relationship("DatabaseView", back_populates="database", cascade="all, delete-orphan")
    rows: Mapped[List["DatabaseRow"]] = relationship("DatabaseRow", back_populates="database", cascade="all, delete-orphan", order_by="DatabaseRow.position")


class DatabaseProperty(Base):
    __tablename__ = "database_properties"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    database_id: Mapped[str] = mapped_column(String(36), ForeignKey("databases.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(32), default="text") 
    # Types: title, text, number, select, multi_select, status, date, checkbox, url, person
    position: Mapped[str] = mapped_column(String(64), default="a0")
    config: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict) # Options, colors, format

    database: Mapped["DatabaseModel"] = relationship("DatabaseModel", back_populates="properties")
    cells: Mapped[List["DatabaseCell"]] = relationship("DatabaseCell", back_populates="property", cascade="all, delete-orphan")


class DatabaseView(Base):
    __tablename__ = "database_views"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    database_id: Mapped[str] = mapped_column(String(36), ForeignKey("databases.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), default="All Records")
    type: Mapped[str] = mapped_column(String(32), default="table") # table, board, calendar, gallery
    filters: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    sorts: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    config: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict) # GroupBy column for board, visible columns

    database: Mapped["DatabaseModel"] = relationship("DatabaseModel", back_populates="views")


class DatabaseRow(Base):
    __tablename__ = "database_rows"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    database_id: Mapped[str] = mapped_column(String(36), ForeignKey("databases.id"), nullable=False)
    position: Mapped[str] = mapped_column(String(64), default="a0")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    database: Mapped["DatabaseModel"] = relationship("DatabaseModel", back_populates="rows")
    cells: Mapped[List["DatabaseCell"]] = relationship("DatabaseCell", back_populates="row", cascade="all, delete-orphan")


class DatabaseCell(Base):
    __tablename__ = "database_cells"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    row_id: Mapped[str] = mapped_column(String(36), ForeignKey("database_rows.id"), nullable=False)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("database_properties.id"), nullable=False)
    value: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)

    row: Mapped["DatabaseRow"] = relationship("DatabaseRow", back_populates="cells")
    property: Mapped["DatabaseProperty"] = relationship("DatabaseProperty", back_populates="cells")
