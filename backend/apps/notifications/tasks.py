from celery import shared_task

from django.conf import settings
from .services.email_service import send_email
from .services.email_templates import build_verification_email, build_password_reset_email, build_notification_email, build_weekly_summary_email

from apps.common.logger import logger
from django.utils import timezone

from apps.notifications.models import Notification
from apps.tenants.models import TenantMembership
from apps.request_management.models import Request

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
    

@shared_task
def email_fallback_for_offline_users():
    """
    Every 15 min — email notifications that are:
    - unread
    - not yet emailed
    - created more than 5 minutes ago (user was offline when WS pushed)
    """

    cutoff = timezone.now() - timezone.timedelta(
        minutes=settings.EMAIL_FALLBACK_DELAY_MINUTES
    )

    pending = Notification.objects.filter(
        is_read=False,
        emailed_at__isnull=True,
        created_at__lte=cutoff,
    ).select_related("recipient", "tenant", "related_request")

    sent = 0
    now = timezone.now()

    for notif in pending:
      try:
          email_data = build_notification_email(notif)
          send_email(
              subject=email_data["subject"],
              text_content=email_data["text_content"],
              html_content=email_data["html_content"],
              recipients=[notif.recipient.email],
          )

          notif.emailed_at = now
          notif.save(update_fields=["emailed_at"])
          sent += 1
      except Exception as e:
          logger.error(f"[email_fallback] Failed for notification {notif.id}: {e}")

    logger.info(f"[email_fallback_for_offline_users] Sent {sent} fallback email(s).")
    return sent


@shared_task
def send_weekly_provider_summary():
    """
    Monday 8am IST — email each provider a digest of the past week.
    """
  
    one_week_ago = timezone.now() - timezone.timedelta(days=7)

    provider_memberships = TenantMembership.objects.filter(
        role="provider",
        is_active=True,
    ).select_related("user", "tenant")

    sent = 0

    for membership in provider_memberships:
        tenant = membership.tenant
        user = membership.user

        requests_received = Request.objects.filter(
            tenant=tenant,
            created_at__gte=one_week_ago,
            is_deleted=False,
        ).count()


        requests_delivered = Request.objects.filter(
            tenant=tenant,
            status__in=[Request.Status.DELIVERED, Request.Status.CLOSED],
            updated_at__gte=one_week_ago,
            is_deleted=False,
        ).count()

        if requests_received == 0 and requests_delivered == 0:
            continue
        
        try:
            email_data = build_weekly_summary_email(
                display_name=user.display_name,
                tenant_name=tenant.name,
                requests_received=requests_received,
                requests_delivered=requests_delivered,
            )
            send_email(
                subject=email_data["subject"],
                text_content=email_data["text_content"],
                html_content=email_data["html_content"],
                recipients=[user.email]
            )

            sent+=1
        except Exception as e:
            logger.error(
                f"[weekly_summary] Failed for {user.email} / {tenant.slug}: {e}"
            )

    logger.info(f"[send_weekly_provider_summary] Sent {sent} summary email(s).")
    return sent



    



          
        
