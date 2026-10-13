from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

Token.model_rebuild()
