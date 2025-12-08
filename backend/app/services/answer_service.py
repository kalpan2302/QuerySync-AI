"""Answer service for question replies."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.answer import Answer
from app.schemas.answer import AnswerCreate


async def create_answer(
    db: AsyncSession,
    question_id: int,
    answer_data: AnswerCreate,
    user_id: Optional[int] = None,
) -> Answer:
    """Create a new answer for a question."""
    answer = Answer(
        question_id=question_id,
        user_id=user_id,
        guest_name=answer_data.guest_name if not user_id else None,
        message=answer_data.message,
    )
    db.add(answer)
    await db.commit()
    await db.refresh(answer)
    return answer


async def get_answers_for_question(
    db: AsyncSession, question_id: int
) -> list[Answer]:
    """Get all answers for a specific question."""
    result = await db.execute(
        select(Answer)
        .where(Answer.question_id == question_id)
        .order_by(Answer.created_at)
    )
    return list(result.scalars().all())
