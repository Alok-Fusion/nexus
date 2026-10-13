from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import re
from app.models.user import User, Workspace, WorkspaceMember
from app.schemas.auth import UserRegister, UserLogin, UserResponse
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from app.core.security import get_password_hash, verify_password, create_access_token
from app.services.fractional_index import generate_key_between

class AuthService:
    @staticmethod
    async def register(db: AsyncSession, data: UserRegister):
        # Check existing email
        stmt = select(User).where(User.email == data.email.lower())
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="User with this email already exists")

        user = User(
            email=data.email.lower(),
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name
        )
        db.add(user)
        await db.flush()

        # Create default personal workspace
        slug = re.sub(r'[^a-zA-Z0-9]', '-', data.full_name.lower()).strip('-') or "personal"
        workspace = Workspace(
            name=f"{data.full_name}'s Workspace",
            slug=f"{slug}-{user.id[:6]}",
            owner_id=user.id
        )
        db.add(workspace)
        await db.flush()

        membership = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role="OWNER"
        )
        db.add(membership)
        await db.commit()
        await db.refresh(user)

        token = create_access_token(user.id)
        return {"access_token": token, "token_type": "bearer", "user": UserResponse.model_validate(user), "default_workspace_slug": workspace.slug}

    @staticmethod
    async def login(db: AsyncSession, data: UserLogin):
        stmt = select(User).where(User.email == data.email.lower())
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        token = create_access_token(user.id)
        return {"access_token": token, "token_type": "bearer", "user": UserResponse.model_validate(user)}


class WorkspaceService:
    @staticmethod
    async def get_user_workspaces(db: AsyncSession, user_id: str):
        stmt = select(Workspace, WorkspaceMember.role).join(
            WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id
        ).where(WorkspaceMember.user_id == user_id)
        res = await db.execute(stmt)
        rows = res.all()
        workspaces = []
        for ws, role in rows:
            ws_dict = {
                "id": ws.id,
                "name": ws.name,
                "slug": ws.slug,
                "icon": ws.icon,
                "description": ws.description,
                "owner_id": ws.owner_id,
                "role": role,
                "created_at": ws.created_at
            }
            workspaces.append(ws_dict)
        return workspaces

    @staticmethod
    async def create_workspace(db: AsyncSession, user_id: str, data: WorkspaceCreate):
        slug_base = re.sub(r'[^a-zA-Z0-9]', '-', data.name.lower()).strip('-') or "workspace"
        slug = f"{slug_base}-{user_id[:6]}"
        workspace = Workspace(
            name=data.name,
            slug=slug,
            icon=data.icon or "⚡",
            description=data.description,
            owner_id=user_id
        )
        db.add(workspace)
        await db.flush()

        membership = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user_id,
            role="OWNER"
        )
        db.add(membership)
        await db.commit()
        await db.refresh(workspace)
        return workspace
