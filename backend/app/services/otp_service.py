"""OTP service for email verification."""

import logging
import random
from datetime import datetime, timedelta

from app.services.notification_service import send_email_notification

logger = logging.getLogger(__name__)

# In-memory OTP storage (in production, use Redis or database)
# Format: {email: {"otp": "1234", "expires_at": datetime, "verified": False}}
_otp_storage: dict[str, dict] = {}

# OTP Configuration
OTP_LENGTH = 4
OTP_EXPIRY_MINUTES = 10


def generate_otp() -> str:
    """Generate a 4-digit OTP."""
    return "".join([str(random.randint(0, 9)) for _ in range(OTP_LENGTH)])


async def send_otp(email: str) -> bool:
    """Generate and send OTP to the given email."""
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # Store OTP
    _otp_storage[email] = {
        "otp": otp,
        "expires_at": expires_at,
        "verified": False,
    }

    logger.info(f"Generated OTP for {email}: {otp} (expires at {expires_at})")

    # Send email
    subject = "[QuerySync] Your Verification Code"
    body = f"""Your verification code for QuerySync AI admin registration is:

    {otp}

This code will expire in {OTP_EXPIRY_MINUTES} minutes.

If you did not request this code, please ignore this email.
"""

    success = await send_email_notification([email], subject, body)
    if success:
        logger.info(f"OTP email sent to {email}")
    else:
        logger.error(f"Failed to send OTP email to {email}")
        # Clean up on failure
        del _otp_storage[email]

    return success


def verify_otp(email: str, otp: str) -> tuple[bool, str]:
    """
    Verify the OTP for the given email.
    Returns (success, message).
    """
    if email not in _otp_storage:
        return False, "No OTP found for this email. Please request a new one."

    stored = _otp_storage[email]

    # Check expiration
    if datetime.utcnow() > stored["expires_at"]:
        del _otp_storage[email]
        return False, "OTP has expired. Please request a new one."

    # Check OTP value
    if stored["otp"] != otp:
        return False, "Invalid OTP. Please try again."

    # Mark as verified
    _otp_storage[email]["verified"] = True
    logger.info(f"OTP verified for {email}")

    return True, "OTP verified successfully."


def is_email_verified(email: str) -> bool:
    """Check if the email has been verified with OTP."""
    if email not in _otp_storage:
        return False
    return _otp_storage[email].get("verified", False)


def clear_otp(email: str) -> None:
    """Clear OTP data for the given email after successful registration."""
    if email in _otp_storage:
        del _otp_storage[email]
        logger.info(f"Cleared OTP data for {email}")
