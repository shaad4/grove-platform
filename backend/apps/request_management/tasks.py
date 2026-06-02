"""
Celery tasks for the requests module.

AI tasks (ai_summary, ai_category) are stubbed here.
Wire them up when the OpenAI integration is ready —
the hooks in services.py already call these after request creation.
"""
from config.celery import app


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