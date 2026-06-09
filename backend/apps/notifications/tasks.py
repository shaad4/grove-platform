from celery import shared_task

from django.conf import settings
from .services.email_service import send_email
from .services.email_templates import build_verification_email, build_password_reset_email

from apps.common.logger import logger
from django.utils import timezone

from apps.notifications.models import Notification

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_verification_email(
    self,
    user_email,
    display_name,
    token
):
    """
    Sends Grove verification email with HTML UI.
    Retries automatically on failure.
    """

    verify_url = (
        f"{settings.FRONTEND_URL}"
        f"/verify-email?token={token}"
    )

    email_data = build_verification_email(
        display_name=display_name,
        verify_url=verify_url
    )

    try:
        send_email(
            subject=email_data["subject"],
            text_content=email_data["text_content"],
            html_content=email_data["html_content"],
            recipients=[user_email],
        )

    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry=60)
def send_password_reset_email(self, user_email, display_name, token, tenant_slug=None):
    """
    Sends Grove password reset email with HTML UI.
    Retries automatically on failure.
    """
    
    base_frontend = settings.FRONTEND_URL.replace("http://", "").replace("https://", "")

    if tenant_slug:
        reset_url = (
            f"http://{tenant_slug}.{base_frontend}"
            f"/reset-password?token={token}"
        )
    else:
        reset_url = (
            f"{settings.FRONTEND_URL}"
            f"/reset-password?token={token}"
        )

    
    email_data = build_password_reset_email(
        display_name = display_name,
        reset_url = reset_url,
    )

    try:
        send_email(
            subject=email_data["subject"],
            text_content=email_data["text_content"],
            html_content=email_data["html_content"],
            recipients=[user_email],
        )

    except Exception as exc:
        raise self.retry(exc=exc)   