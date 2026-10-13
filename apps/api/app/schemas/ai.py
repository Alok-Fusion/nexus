from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class SearchResultItem(BaseModel):
    id: str
    type: str # page, block, database, row
    title: str
    subtitle: Optional[str] = None
    icon: Optional[str] = None
    url: str
    highlights: Optional[str] = None
    score: float = 1.0

class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResultItem]

class AIChatMessage(BaseModel):
    role: str # user, assistant, system
    content: str

class AIChatRequest(BaseModel):
    prompt: str
    page_id: Optional[str] = None
    context_type: Optional[str] = "workspace" # page, selection, workspace
    history: List[AIChatMessage] = []

class AIActionPreview(BaseModel):
    action_type: str # create_page, create_task, update_block, create_database
    description: str
    is_destructive: bool = False
    payload: Dict[str, Any]

class AIChatResponse(BaseModel):
    message: str
    suggested_actions: List[AIActionPreview] = []
    sources: List[Dict[str, str]] = [] # [{title, url}]
    model_used: str
    is_fallback: bool = False

class AIStatusResponse(BaseModel):
    status: str # connected, offline
    provider: str
    model: str
    base_url: str
    message: Optional[str] = None
