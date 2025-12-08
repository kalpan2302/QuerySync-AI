"""Answer schemas for request/response validation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AnswerBase(BaseModel):
    """Base answer schema."""

    message: str = Field(..., min_length=1, max_length=5000)


class AnswerCreate(AnswerBase):
    """Schema for creating an answer."""

    guest_name: Optional[str] = Field(None, max_length=100)


class AnswerOut(BaseModel):
    """Schema for answer response."""

    id: int
    question_id: int
    user_id: Optional[int] = None
    guest_name: Optional[str] = None
    message: str
    created_at: datetime

    class Config:
        from_attributes = True
