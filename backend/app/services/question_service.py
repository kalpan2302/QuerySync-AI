"""Question service for Q&A operations."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import case, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.question import Question, QuestionStatus
from app.schemas.question import QuestionCreate


async def create_question(
    db: AsyncSession,
    question_data: QuestionCreate,
    user_id: Optional[int] = None,
) -> Question:
    """Create a new question."""
    status = (
        QuestionStatus.ESCALATED
        if question_data.is_escalated
        else QuestionStatus.PENDING
    )
    question = Question(
        user_id=user_id,
        guest_name=question_data.guest_name if not user_id else None,
        message=question_data.message,
        status=status,
        escalated_at=datetime.now(timezone.utc) if question_data.is_escalated else None,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


async def get_questions(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    status: Optional[QuestionStatus] = None,
) -> list[Question]:
    """
    Get questions ordered by:
    1. Escalated first
    2. Then by created_at (newest first)
    """
    query = select(Question).options(selectinload(Question.answers))

    if status:
        query = query.where(Question.status == status)

    # Order: ESCALATED first, then by created_at descending
    query = query.order_by(
        case(
            (Question.status == QuestionStatus.ESCALATED, 0),
            else_=1,
        ),
        desc(Question.created_at),
    )

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_question_by_id(
    db: AsyncSession, question_id: int
) -> Optional[Question]:
    """Get a question by ID with its answers."""
    query = (
        select(Question)
        .options(selectinload(Question.answers))
        .where(Question.id == question_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def update_question_status(
    db: AsyncSession,
    question_id: int,
    new_status: QuestionStatus,
) -> Optional[Question]:
    """Update question status."""
    question = await get_question_by_id(db, question_id)
    if not question:
        return None

    question.status = new_status
    now = datetime.now(timezone.utc)

    if new_status == QuestionStatus.ESCALATED:
        question.escalated_at = now
    elif new_status == QuestionStatus.ANSWERED:
        question.answered_at = now

    await db.commit()
    await db.refresh(question)
    return question


async def get_question_stats(db: AsyncSession) -> dict:
    """Get question statistics for admin dashboard."""
    # Count by status
    status_counts = await db.execute(
        select(Question.status, func.count(Question.id))
        .group_by(Question.status)
    )
    counts = {str(row[0].value): row[1] for row in status_counts.all()}

    # Total questions
    total_result = await db.execute(select(func.count(Question.id)))
    total = total_result.scalar()

    # Average time to answer (for answered questions)
    avg_time_result = await db.execute(
        select(
            func.avg(
                func.extract(
                    "epoch",
                    Question.answered_at - Question.created_at
                )
            )
        ).where(Question.answered_at.isnot(None))
    )
    avg_seconds = avg_time_result.scalar() or 0

    return {
        "total": total,
        "pending": counts.get("PENDING", 0),
        "escalated": counts.get("ESCALATED", 0),
        "answered": counts.get("ANSWERED", 0),
        "avg_time_to_answer_seconds": round(avg_seconds, 2),
        "avg_time_to_answer_minutes": round(avg_seconds / 60, 2) if avg_seconds else 0,
    }
