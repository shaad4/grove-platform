from django.utils import timezone
from django.db import DatabaseError
from common.logger import logger
from .models import Message, MessageAttachment

class MessageRepository:

    @staticmethod
    def get_for_request(request_id, tenant_id):
        try:
            return (
                Message.objects
                .filter(request_id=request_id, tenant_id=tenant_id)
                .select_related("sender")
                .order_by("created_at")
            )
        except DatabaseError as e:
                logger.error(f"[MessageRepository.get_for_request] DB error: {e}")
                return Message.objects.none()
        
    
    @staticmethod
    def create(request_obj, sender, content):
        try:
            return Message.objects.create(
                request=request_obj,
                tenant=request_obj.tenant,
                sender=sender,
                content=content,
            )
        except DatabaseError as e:
            logger.error(f"[MessageRepository.create] DB error: {e}")
            raise

    @staticmethod
    def mark_read(request_obj, exclude_sender):
        """Mark all unread messages not sent by exclude_sender as read."""
        try:
            return (
                Message.objects
                .filter(request=request_obj, is_read=False)
                .exclude(sender=exclude_sender)
                .update(is_read=True, read_at=timezone.now())
            )
        except DatabaseError as e:
            logger.error(f"[MessageRepository.mark_read] DB error: {e}")
            return 0

        

