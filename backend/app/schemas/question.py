"""Question schemas for request/response validation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.question import QuestionStatus


class QuestionBase(BaseModel):
    """Base question schema."""

    message: str = Field(..., min_length=1, max_length=5000)


class QuestionCreate(QuestionBase):
    """Schema for creating a question."""

    guest_name: Optional[str] = Field(None, max_length=100)
    is_escalated: bool = False


class QuestionUpdateStatus(BaseModel):
    """Schema for updating question status."""

    status: QuestionStatus


class QuestionOut(BaseModel):
    """Schema for question response."""

    id: int
    user_id: Optional[int] = None
    guest_name: Optional[str] = None
    message: str
    status: QuestionStatus
    created_at: datetime
    updated_at: datetime
    escalated_at: Optional[datetime] = None
    answered_at: Optional[datetime] = None
    answers_count: int = 0

    class Config:
        from_attributes = True


class QuestionWithAnswers(QuestionOut):
    """Schema for question with answers list."""

    answers: list["AnswerOut"] = []


# Import at the end to avoid circular imports
from app.schemas.answer import AnswerOut  # noqa: E402

QuestionWithAnswers.model_rebuild()
