"""Services module initialization."""

from app.services.answer_service import create_answer, get_answers_for_question
from app.services.auth_service import (
    authenticate_user,
    create_user,
    get_all_admin_emails,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
)
from app.services.notification_service import notify_question_answered
from app.services.question_service import (
    create_question,
    get_question_by_id,
    get_question_stats,
    get_questions,
    update_question_status,
)
from app.services.rag_service import get_suggested_answer

__all__ = [
    "authenticate_user",
    "create_user",
    "get_all_admin_emails",
    "get_user_by_email",
    "get_user_by_id",
    "get_user_by_username",
    "create_question",
    "get_question_by_id",
    "get_question_stats",
    "get_questions",
    "update_question_status",
    "create_answer",
    "get_answers_for_question",
    "notify_question_answered",
    "get_suggested_answer",
]
