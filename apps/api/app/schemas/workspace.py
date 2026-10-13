from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class WorkspaceCreate(BaseModel):
    name: str
    icon: Optional[str] = "⚡"
    description: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None

class WorkspaceMemberResponse(BaseModel):
    id: str
    user_id: str
    email: str
    full_name: str
    role: str

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str
    icon: Optional[str]
    description: Optional[str]
    owner_id: str
    role: Optional[str] = "OWNER"
    created_at: datetime

    class Config:
        from_attributes = True
