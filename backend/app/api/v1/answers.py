"""Answers API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional, get_current_admin
from app.db import get_db
from app.models.user import User
from app.models.answer import Answer
from app.schemas.answer import AnswerCreate, AnswerOut, RatingRequest, RatingResponse
from app.services import create_answer, get_question_by_id
from app.websocket import manager

router = APIRouter(prefix="/questions/{question_id}/answers", tags=["answers"])


def build_answer_tree(answers: list[Answer], parent_id: int | None = None) -> list[dict]:
    """Build nested answer tree from flat list."""
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
    Supports threading via parent_id.
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

    # If parent_id is provided, verify the parent answer exists
    if answer_data.parent_id:
        result = await db.execute(
            select(Answer).where(
                Answer.id == answer_data.parent_id,
                Answer.question_id == question_id
            )
        )
        parent_answer = result.scalar_one_or_none()
        if not parent_answer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent answer not found",
            )

    user_id = current_user.id if current_user else None
    answer = await create_answer(db, question_id, answer_data, user_id)

    answer_out = AnswerOut(
        id=answer.id,
        question_id=answer.question_id,
        user_id=answer.user_id,
        parent_id=answer.parent_id,
        guest_name=answer.guest_name,
        message=answer.message,
        created_at=answer.created_at,
        upvotes=answer.upvotes,
        downvotes=answer.downvotes,
        score=answer.upvotes - answer.downvotes,
        replies=[],
    )

    # Broadcast to WebSocket clients
    await manager.broadcast("new_answer", answer_out.model_dump(mode="json"))

    return answer_out


@router.post("/{answer_id}/rate", response_model=RatingResponse)
async def rate_answer(
    question_id: int,
    answer_id: int,
    rating: RatingRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Rate an answer (upvote or downvote).
    Each admin can only vote once per answer, but can change their vote.
    """
    from app.models.vote import Vote

    # Get the answer
    result = await db.execute(
        select(Answer).where(
            Answer.id == answer_id,
            Answer.question_id == question_id
        )
    )
    answer = result.scalar_one_or_none()

    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found",
        )

    # Check if admin has already voted on this answer
    vote_result = await db.execute(
        select(Vote).where(
            Vote.answer_id == answer_id,
            Vote.user_id == admin.id
        )
    )
    existing_vote = vote_result.scalar_one_or_none()

    if existing_vote:
        # Admin already voted
        if existing_vote.vote_type == rating.vote:
            # Same vote type - return error (can't vote twice the same way)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have already {rating.vote}voted this answer",
            )
        else:
            # Changing vote from up to down or vice versa
            # Remove the old vote effect
            if existing_vote.vote_type == "up":
                answer.upvotes -= 1
            else:
                answer.downvotes -= 1

            # Apply new vote
            if rating.vote == "up":
                answer.upvotes += 1
            else:
                answer.downvotes += 1

            # Update the vote record
            existing_vote.vote_type = rating.vote
    else:
        # New vote
        new_vote = Vote(
            answer_id=answer_id,
            user_id=admin.id,
            vote_type=rating.vote,
        )
        db.add(new_vote)

        # Apply the vote
        if rating.vote == "up":
            answer.upvotes += 1
        else:
            answer.downvotes += 1

    await db.commit()
    await db.refresh(answer)

    # Broadcast rating update
    await manager.broadcast(
        "answer_rated",
        {
            "answer_id": answer.id,
            "question_id": question_id,
            "upvotes": answer.upvotes,
            "downvotes": answer.downvotes,
            "score": answer.upvotes - answer.downvotes,
        }
    )

    return RatingResponse(
        answer_id=answer.id,
        upvotes=answer.upvotes,
        downvotes=answer.downvotes,
        score=answer.upvotes - answer.downvotes,
    )
