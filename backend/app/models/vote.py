"""Vote model for tracking answer ratings."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.answer import Answer
    from app.models.user import User


class Vote(Base):
    """Vote model to track admin ratings on answers (one vote per admin per answer)."""

    __tablename__ = "votes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    answer_id: Mapped[int] = mapped_column(
        ForeignKey("answers.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    vote_type: Mapped[str] = mapped_column(String(10), nullable=False)  # "up" or "down"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Unique constraint: one vote per user per answer
    __table_args__ = (
        UniqueConstraint('answer_id', 'user_id', name='unique_user_answer_vote'),
    )

    # Relationships
    answer: Mapped["Answer"] = relationship("Answer", backref="votes")
    user: Mapped["User"] = relationship("User", backref="votes")
