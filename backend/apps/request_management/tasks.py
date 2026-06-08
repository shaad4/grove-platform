"""
Celery tasks for the requests module.

AI tasks (ai_summary, ai_category) are stubbed here.
Wire them up when the OpenAI integration is ready —
the hooks in services.py already call these after request creation.
"""
from config.celery import app
from apps.common.logger import logger
from django.utils import timezone

from apps.request_management.models import Request, File
from apps.clients.models import Client

@app.task(bind=True, max_retries=3, default_retry_delay=10)
def generate_ai_summary(self, request_id: str):
    """
    Generate a 2-3 sentence summary for a request.
    Stores result in requests.ai_summary.
    TODO: implement with OpenAI when ready.
    """
    pass


@app.task(bind=True, max_retries=3, default_retry_delay=10)
def generate_ai_category(self, request_id: str):
    """
    Assign a category to a request (design, dev, content, feedback).
    Stores result in requests.ai_category.
    TODO: implement with OpenAI when ready.
    """
    pass

@app.task
def purge_soft_deleted_records():
    """
    Nightly — hard-delete records soft-deleted more than 30 days ago.
    Covers: Request, Client, File.
    """

    cutoff = timezone.now() - timezone.timedelta(days=30)

    deleted_requests, _ = Request.objects.filter(
        is_deleted=True,
        deleted_at__lt=cutoff,
    ).delete()

    deleted_clients, _ = Client.objects.filter(
        is_deleted=True,
        deleted_at__lt=cutoff,
    ).delete()

    deleted_files, _ = File.objects.filter(
        is_deleted=True,
        deleted_at__lt=cutoff,
    ).delete()

    logger.info(
        f"[purge_soft_deleted_records] "
        f"Requests: {deleted_requests}, "
        f"Clients: {deleted_clients}, "
        f"Files: {deleted_files}"
    )

    return {
        "requests": deleted_requests,
        "clients": deleted_clients,
        "files": deleted_files,
    }
