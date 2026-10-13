from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class BlockCreate(BaseModel):
    id: Optional[str] = None
    parent_id: Optional[str] = None
    type: str = "paragraph"
    position: Optional[str] = None
    content: Dict[str, Any] = {}
    properties: Dict[str, Any] = {}

class BlockUpdate(BaseModel):
    parent_id: Optional[str] = None
    type: Optional[str] = None
    position: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    properties: Optional[Dict[str, Any]] = None

class BlockResponse(BaseModel):
    id: str
    page_id: str
    parent_id: Optional[str]
    type: str
    position: str
    content: Dict[str, Any]
    properties: Dict[str, Any]
    updated_at: datetime

    class Config:
        from_attributes = True

class PageCreate(BaseModel):
    parent_id: Optional[str] = None
    title: str = "Untitled"
    icon: Optional[str] = "📄"
    cover_url: Optional[str] = None
    position: Optional[str] = None

class PageUpdate(BaseModel):
    title: Optional[str] = None
    icon: Optional[str] = None
    cover_url: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None
    parent_id: Optional[str] = None
    position: Optional[str] = None

class PageTreeItem(BaseModel):
    id: str
    parent_id: Optional[str]
    title: str
    icon: Optional[str]
    is_favorite: bool
    is_archived: bool
    position: str
    updated_at: datetime
    children: List["PageTreeItem"] = []

    class Config:
        from_attributes = True

class PageDetailResponse(BaseModel):
    id: str
    workspace_id: str
    parent_id: Optional[str]
    title: str
    icon: Optional[str]
    cover_url: Optional[str]
    is_favorite: bool
    is_archived: bool
    position: str
    created_at: datetime
    updated_at: datetime
    blocks: List[BlockResponse] = []

    class Config:
        from_attributes = True

PageTreeItem.model_rebuild()
