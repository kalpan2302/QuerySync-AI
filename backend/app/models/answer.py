"""Answer model."""

from datetime import datetime
from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.question import Question
    from app.models.user import User


class Answer(Base):
    """Answer model for question replies with rating support."""

    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    # Parent answer for threading (null = top-level answer)
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("answers.id", ondelete="CASCADE"), nullable=True
    )
    guest_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Rating fields
    upvotes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    downvotes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    question: Mapped["Question"] = relationship("Question", back_populates="answers")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="answers")

    # Self-referential relationship for threading
    parent: Mapped[Optional["Answer"]] = relationship(
        "Answer",
        back_populates="replies",
        remote_side=[id],
    )
    replies: Mapped[List["Answer"]] = relationship(
        "Answer",
        back_populates="parent",
        cascade="all, delete-orphan",
    )

    @property
    def score(self) -> int:
        """Calculate net score (upvotes - downvotes)."""
        return self.upvotes - self.downvotes
