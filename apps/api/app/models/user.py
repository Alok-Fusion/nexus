from sqlalchemy import String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from datetime import datetime
from app.models.base import Base, generate_uuid, utc_now

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    memberships: Mapped[List["WorkspaceMember"]] = relationship("WorkspaceMember", back_populates="user", cascade="all, delete-orphan")


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(64), default="⚡")
    description: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    members: Mapped[List["WorkspaceMember"]] = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    pages: Mapped[List["Page"]] = relationship("Page", back_populates="workspace", cascade="all, delete-orphan")
    databases: Mapped[List["DatabaseModel"]] = relationship("DatabaseModel", back_populates="workspace", cascade="all, delete-orphan")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="OWNER") # OWNER, ADMIN, MEMBER, VIEWER
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    user: Mapped["User"] = relationship("User", back_populates="memberships")
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="members")
