"""Answer schemas for request/response validation."""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class AnswerBase(BaseModel):
    """Base answer schema."""

    message: str = Field(..., min_length=1, max_length=5000)


class AnswerCreate(AnswerBase):
    """Schema for creating an answer."""

    guest_name: Optional[str] = Field(None, max_length=100)
    parent_id: Optional[int] = None  # For threading - reply to another answer


class AnswerOut(BaseModel):
    """Schema for answer response."""

    id: int
    question_id: int
    user_id: Optional[int] = None
    parent_id: Optional[int] = None
    guest_name: Optional[str] = None
    message: str
    created_at: datetime
    upvotes: int = 0
    downvotes: int = 0
    score: int = 0
    replies: List["AnswerOut"] = []

    class Config:
        from_attributes = True


class AnswerWithReplies(AnswerOut):
    """Answer with nested replies for threading display."""

    replies: List["AnswerOut"] = []


class RatingRequest(BaseModel):
    """Schema for rating an answer."""

    vote: str = Field(..., pattern="^(up|down)$")  # "up" or "down"


class RatingResponse(BaseModel):
    """Schema for rating response."""

    answer_id: int
    upvotes: int
    downvotes: int
    score: int
