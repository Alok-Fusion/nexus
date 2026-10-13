from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, Workspace, WorkspaceMember

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

async def get_workspace_membership(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> WorkspaceMember:
    stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    membership = (await db.execute(stmt)).scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this workspace")
    return membership
