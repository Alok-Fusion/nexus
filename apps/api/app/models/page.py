from sqlalchemy import String, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, Any, Dict
from datetime import datetime
from app.models.base import Base, generate_uuid, utc_now

class Page(Base):
    __tablename__ = "pages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id"), nullable=False)
    parent_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("pages.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), default="Untitled")
    icon: Mapped[Optional[str]] = mapped_column(String(64), default="📄")
    cover_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[str] = mapped_column(String(64), default="a0")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="pages")
    parent: Mapped[Optional["Page"]] = relationship("Page", remote_side=[id], back_populates="children")
    children: Mapped[List["Page"]] = relationship("Page", back_populates="parent", cascade="all, delete-orphan")
    blocks: Mapped[List["Block"]] = relationship("Block", back_populates="page", cascade="all, delete-orphan", order_by="Block.position")


class Block(Base):
    __tablename__ = "blocks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    page_id: Mapped[str] = mapped_column(String(36), ForeignKey("pages.id"), nullable=False)
    parent_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("blocks.id"), nullable=True)
    type: Mapped[str] = mapped_column(String(32), default="paragraph") 
    # Types: paragraph, heading_1, heading_2, heading_3, todo, bulleted_list, numbered_list, toggle, quote, callout, code, divider, database
    position: Mapped[str] = mapped_column(String(64), default="a0", index=True) # Lexorank fractional ordering
    content: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    properties: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    page: Mapped["Page"] = relationship("Page", back_populates="blocks")
    parent: Mapped[Optional["Block"]] = relationship("Block", remote_side=[id], back_populates="children")
    children: Mapped[List["Block"]] = relationship("Block", back_populates="parent", cascade="all, delete-orphan")
