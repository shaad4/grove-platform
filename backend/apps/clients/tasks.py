from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils import timezone

from apps.clients.models import Client, Invite
from apps.common.logger import logger
from apps.request_management.models import Request

CLIENT_INSIGHT_TTL = settings.CLIENT_INSIGHT_TTL


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_client_invite_email(
    self,
    client_email: str,
    client_name: str,
    provider_name: str,
    tenant_slug: str,
    invite_token: str,
):

    frontend_base = settings.FRONTEND_URL
    base = frontend_base.replace("https://", "").replace("http://", "")
    accept_url = f"https://{tenant_slug}.{base}/accept-invite?token={invite_token}"

    subject = f"You've been invited to {provider_name}'s workspace on Groven"

    message = f"""Hi {client_name},

{provider_name} has invited you to their client workspace on Groven.

Click the link below to set your password and get started:

{accept_url}

This link expires in 48 hours.

If you weren't expecting this invite, you can ignore this email.

— The Groven Team
"""

    html_message = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Inter, sans-serif; background: #F7F8F7; padding: 40px 0;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #E8EAE8;">
    
    <div style="margin-bottom: 32px;">
      <span style="font-size: 20px; font-weight: 600; color: #0F6E56;">Groven</span>
    </div>

    <h1 style="font-size: 22px; font-weight: 500; color: #141A14; margin: 0 0 8px;">
      You're invited
    </h1>
    <p style="font-size: 14px; color: #4A544A; margin: 0 0 32px;">
      <strong>{provider_name}</strong> has invited you to their workspace on Groven.
    </p>

    <a href="{accept_url}"
       style="display: inline-block; background: #0F6E56; color: #ffffff;
              text-decoration: none; padding: 12px 24px; border-radius: 8px;
              font-size: 14px; font-weight: 500;">
      Accept Invite &amp; Set Password
    </a>

    <p style="font-size: 13px; color: #9EA89E; margin: 32px 0 0;">
      This link expires in 48 hours. If you weren't expecting this, ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #E8EAE8; margin: 32px 0;" />
    <p style="font-size: 12px; color: #9EA89E; margin: 0;">Groven — Client Portal</p>
  </div>
</body>
</html>
"""

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[client_email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task
def expire_old_invites():
    """
    Every hour — mark pending invites past their expiry as expired.
    """

    now = timezone.now()
    updated = Invite.objects.filter(
        status="pending",
        expires_at__lt=now,
    ).update(status="expired")

    logger.info(f"[expire_old_invites] Marked {updated} invite(s) as expired.")
    return updated


@shared_task
def mark_inactive_clients():
    """
    Nightly — flag clients with no request activity in 90+ days.
    Uses last request updated_at as the activity signal.
    """

    cutoff = timezone.now() - timezone.timedelta(days=90)

    active_client_ids = (
        Request.objects.filter(
            is_deleted=False,
            updated_at_gte=cutoff,
        )
        .values_list("client_id", flat=True)
        .distinct()
    )

    updated = (
        Client.objects.filter(
            is_deleted=False,
            is_deactivated=False,
        )
        .exclude(
            id__in=active_client_ids,
        )
        .update(is_deactivated=True)
    )

    logger.info(f"[mark_inactive_clients] Deactivated {updated} inactive client(s).")
    return updated


@shared_task
def generate_client_insights():
    """Nightly scan — flags clients gone quiet or spiking in volume. Cache-only, no schema change."""
    cutoff_quiet = timezone.now() - timedelta(days=14)
    cutoff_recent = timezone.now() - timedelta(days=7)

    for client in Client.objects.filter(
        is_deleted=False, is_deactivated=False
    ).iterator():
        recent_count = Request.objects.filter(
            client=client, is_deleted=False, created_at__gte=cutoff_recent
        ).count()
        last_request = (
            Request.objects.filter(client=client, is_deleted=False)
            .order_by("-created_at")
            .first()
        )

        insight = None
        if last_request and last_request.created_at < cutoff_quiet:
            insight = "gone_quiet"
        elif recent_count >= 5:
            insight = "high_volume"

        cache.set(f"client_insight:{client.id}", insight, CLIENT_INSIGHT_TTL)
