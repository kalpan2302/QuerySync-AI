"""Answers API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional
from app.db import get_db
from app.models.user import User
from app.schemas.answer import AnswerCreate, AnswerOut
from app.services import create_answer, get_question_by_id
from app.websocket import manager

router = APIRouter(prefix="/questions/{question_id}/answers", tags=["answers"])


@router.post("", response_model=AnswerOut, status_code=status.HTTP_201_CREATED)
async def create_new_answer(
    question_id: int,
    answer_data: AnswerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Create a new answer for a question.
    Can be created by guests (no auth) or logged-in users.
    """
    # Check if question exists
    question = await get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    # Non-blank validation
    if not answer_data.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer message cannot be empty",
        )

    user_id = current_user.id if current_user else None
    answer = await create_answer(db, question_id, answer_data, user_id)

    answer_out = AnswerOut.model_validate(answer)

    # Broadcast to WebSocket clients
    await manager.broadcast("new_answer", answer_out.model_dump(mode="json"))

    return answer_out
