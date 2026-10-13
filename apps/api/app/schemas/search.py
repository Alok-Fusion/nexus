from pydantic import BaseModel
from typing import Optional, List

class SearchResultItem(BaseModel):
    id: str
    type: str # page, block, database
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
