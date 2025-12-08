"""Notification service for webhooks and email."""

import logging
from typing import Optional

import httpx
from aiosmtplib import SMTP

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


async def send_webhook_notification(
    question_id: int,
    status: str,
    answered_at: str,
    answers_count: int,
) -> bool:
    """Send webhook notification when question is answered."""
    if not settings.WEBHOOK_URL:
        logger.info("No WEBHOOK_URL configured, skipping webhook")
        return False

    payload = {
        "event": "question_answered",
        "data": {
            "question_id": question_id,
            "status": status,
            "answered_at": answered_at,
            "answers_count": answers_count,
        },
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.WEBHOOK_URL,
                json=payload,
                timeout=10.0,
            )
            response.raise_for_status()
            logger.info(f"Webhook sent successfully to {settings.WEBHOOK_URL}")
            return True
    except Exception as e:
        logger.error(f"Failed to send webhook: {e}")
        return False


async def send_email_notification(
    to_emails: list[str],
    subject: str,
    body: str,
) -> bool:
    """Send email notification to admins."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info("SMTP not configured, skipping email notification")
        return False

    if not to_emails:
        logger.info("No recipient emails provided")
        return False

    try:
        smtp = SMTP(
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            use_tls=False,
            start_tls=True,
        )

        await smtp.connect()
        await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        for email in to_emails:
            message = f"""From: {settings.EMAIL_FROM}
To: {email}
Subject: {subject}

{body}
"""
            await smtp.sendmail(settings.EMAIL_FROM, email, message)

        await smtp.quit()
        logger.info(f"Email sent to {len(to_emails)} recipients")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


async def notify_question_answered(
    question_id: int,
    question_message: str,
    answered_at: str,
    answers_count: int,
    admin_emails: list[str],
) -> None:
    """Send all notifications when a question is marked as answered."""
    # Send webhook
    await send_webhook_notification(
        question_id=question_id,
        status="ANSWERED",
        answered_at=answered_at,
        answers_count=answers_count,
    )

    # Send email to admins
    subject = f"[QuerySync] Question #{question_id} Answered"
    body = f"""A question has been marked as answered.

Question ID: {question_id}
Question: {question_message[:200]}{"..." if len(question_message) > 200 else ""}
Answered at: {answered_at}
Total answers: {answers_count}

View the full question in the QuerySync dashboard.
"""
    await send_email_notification(admin_emails, subject, body)
