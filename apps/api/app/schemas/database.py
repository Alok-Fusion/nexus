from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DatabasePropertyCreate(BaseModel):
    name: str
    type: str = "text"
    position: Optional[str] = None
    config: Dict[str, Any] = {}

class DatabasePropertyUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    position: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class DatabasePropertyResponse(BaseModel):
    id: str
    database_id: str
    name: str
    type: str
    position: str
    config: Dict[str, Any]

    class Config:
        from_attributes = True

class DatabaseViewCreate(BaseModel):
    name: str = "All Records"
    type: str = "table" # table, board
    filters: List[Dict[str, Any]] = []
    sorts: List[Dict[str, Any]] = []
    config: Dict[str, Any] = {}

class DatabaseViewResponse(BaseModel):
    id: str
    database_id: str
    name: str
    type: str
    filters: List[Dict[str, Any]]
    sorts: List[Dict[str, Any]]
    config: Dict[str, Any]

    class Config:
        from_attributes = True

class DatabaseCellUpdate(BaseModel):
    property_id: str
    value: Any

class DatabaseRowCreate(BaseModel):
    cells: Dict[str, Any] = {} # property_id -> value or property_name -> value
    position: Optional[str] = None

class DatabaseRowResponse(BaseModel):
    id: str
    database_id: str
    position: str
    cells: Dict[str, Any] # property_id -> value
    created_at: datetime
    updated_at: datetime

class DatabaseCreate(BaseModel):
    page_id: Optional[str] = None
    name: str = "Untitled Database"
    icon: Optional[str] = "📊"
    description: Optional[str] = None
    initial_properties: Optional[List[DatabasePropertyCreate]] = None

class DatabaseDetailResponse(BaseModel):
    id: str
    workspace_id: str
    page_id: Optional[str]
    name: str
    icon: Optional[str]
    description: Optional[str]
    properties: List[DatabasePropertyResponse]
    views: List[DatabaseViewResponse]
    rows: List[DatabaseRowResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
