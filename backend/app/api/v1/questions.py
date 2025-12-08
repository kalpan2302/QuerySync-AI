"""Questions API routes."""

from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_current_user_optional
from app.db import get_db
from app.models.question import QuestionStatus
from app.models.user import User
from app.schemas.question import (
    QuestionCreate,
    QuestionOut,
    QuestionUpdateStatus,
    QuestionWithAnswers,
)
from app.services import (
    create_question,
    get_all_admin_emails,
    get_question_by_id,
    get_questions,
    get_suggested_answer,
    notify_question_answered,
    notify_question_escalated,
    update_question_status,
)
from app.websocket import manager

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=list[QuestionOut])
async def list_questions(
    limit: int = 50,
    offset: int = 0,
    status: Optional[QuestionStatus] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all questions.
    Ordered by: ESCALATED first, then by created_at (newest first).
    """
    questions = await get_questions(db, limit=limit, offset=offset, status=status)

    # Add answers count to response
    result = []
    for q in questions:
        question_out = QuestionOut.model_validate(q)
        question_out.answers_count = len(q.answers)
        result.append(question_out)

    return result


@router.post("", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
async def create_new_question(
    question_data: QuestionCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Create a new question.
    Can be created by guests (no auth) or logged-in users.
    """
    # Non-blank validation (also in schema, but double-check)
    if not question_data.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question message cannot be empty",
        )

    user_id = current_user.id if current_user else None
    question = await create_question(db, question_data, user_id)

    # Broadcast to WebSocket clients
    question_out = QuestionOut.model_validate(question)
    question_out.answers_count = 0
    await manager.broadcast("new_question", question_out.model_dump(mode="json"))

    # If question was marked as urgent/escalated on creation, send email to admins
    if question_data.is_escalated:
        # Broadcast urgent notification to all connected clients (for admin popup)
        await manager.broadcast(
            "urgent_question",
            {
                "question_id": question.id,
                "guest_name": question.guest_name or "Anonymous",
                "message": question.message[:100] + ("..." if len(question.message) > 100 else ""),
                "created_at": question_out.created_at.isoformat(),
            }
        )

        # Send email notification in background
        admin_emails = await get_all_admin_emails(db)
        background_tasks.add_task(
            notify_question_escalated,
            question_id=question.id,
            question_message=question.message,
            guest_name=question.guest_name or "Anonymous",
            escalated_at=question_out.escalated_at.isoformat() if question_out.escalated_at else question_out.created_at.isoformat(),
            admin_emails=admin_emails,
        )

    return question_out


@router.get("/{question_id}", response_model=QuestionWithAnswers)
async def get_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific question with its answers (with nested replies)."""
    question = await get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    # Build nested answer tree from flat list
    def build_answer_tree(answers, parent_id=None):
        result = []
        for answer in answers:
            if answer.parent_id == parent_id:
                answer_dict = {
                    "id": answer.id,
                    "question_id": answer.question_id,
                    "user_id": answer.user_id,
                    "parent_id": answer.parent_id,
                    "guest_name": answer.guest_name,
                    "message": answer.message,
                    "created_at": answer.created_at,
                    "upvotes": answer.upvotes,
                    "downvotes": answer.downvotes,
                    "score": answer.upvotes - answer.downvotes,
                    "replies": build_answer_tree(answers, answer.id),
                }
                result.append(answer_dict)
        return result

    # Build the response with nested answers
    nested_answers = build_answer_tree(question.answers)

    return {
        "id": question.id,
        "user_id": question.user_id,
        "guest_name": question.guest_name,
        "message": question.message,
        "status": question.status,
        "created_at": question.created_at,
        "updated_at": question.updated_at,
        "escalated_at": question.escalated_at,
        "answered_at": question.answered_at,
        "answers_count": len(question.answers),
        "answers": nested_answers,
    }


@router.patch("/{question_id}/status", response_model=QuestionOut)
async def change_question_status(
    question_id: int,
    status_update: QuestionUpdateStatus,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Update question status (admin only)."""
    question = await update_question_status(db, question_id, status_update.status)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    question_out = QuestionOut.model_validate(question)
    question_out.answers_count = len(question.answers)

    # Broadcast status change
    await manager.broadcast(
        "status_change",
        {
            "question_id": question_id,
            "status": question_out.status.value,
            "escalated_at": question_out.escalated_at.isoformat() if question_out.escalated_at else None,
            "answered_at": question_out.answered_at.isoformat() if question_out.answered_at else None,
        },
    )

    # If marked as answered, send notifications in background
    if status_update.status == QuestionStatus.ANSWERED:
        admin_emails = await get_all_admin_emails(db)
        background_tasks.add_task(
            notify_question_answered,
            question_id=question_id,
            question_message=question.message,
            answered_at=question_out.answered_at.isoformat() if question_out.answered_at else "",
            answers_count=len(question.answers),
            admin_emails=admin_emails,
        )

    # If escalated, send escalation notifications in background
    if status_update.status == QuestionStatus.ESCALATED:
        admin_emails = await get_all_admin_emails(db)
        background_tasks.add_task(
            notify_question_escalated,
            question_id=question_id,
            question_message=question.message,
            guest_name=question.guest_name or "Admin",
            escalated_at=question_out.escalated_at.isoformat() if question_out.escalated_at else "",
            admin_emails=admin_emails,
        )

    return question_out


@router.post("/{question_id}/suggest")
async def suggest_answer(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Get RAG-powered answer suggestion (admin only)."""
    question = await get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    # Get previous answers for context
    previous_answers = [a.message for a in question.answers]

    suggestion = await get_suggested_answer(
        question_message=question.message,
        previous_answers=previous_answers,
    )

    if not suggestion:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG service unavailable. Please check GROQ_API_KEY configuration.",
        )

    # Broadcast suggestion to WebSocket
    await manager.broadcast(
        "suggestion",
        {
            "question_id": question_id,
            "suggested_answer": suggestion,
        },
    )

    return {"question_id": question_id, "suggested_answer": suggestion}
