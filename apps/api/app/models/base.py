import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, DateTime

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Base(DeclarativeBase):
    pass
