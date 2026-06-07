from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import DatabaseError

from apps.common.logger import logger
from .repositories import MessageRepository


def get_chat_group_name(request_id):
    return f"chat_{request_id}"


def create_message(request_obj, sender, content):
    try:
        message = MessageRepository.create(request_obj, sender, content)
        _broadcast_message(message)
        return message
    except DatabaseError as e:
        logger.error(f"[ChatService.create_message] Failed to create message: {e}")
        raise



def _broadcast_message(message):
    try:
        channel_layer = get_channel_layer()
        group_name = get_chat_group_name(str(message.request_id))
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "chat.message",
                "id": str(message.id),
                "request_id": str(message.request_id),
                "sender_id": str(message.sender_id),
                "sender_name": message.sender.display_name,
                "sender_email": message.sender.email,
                "content": message.content,
                "created_at": message.created_at.isoformat(),
            },
        )
    except Exception as e:
        logger.error(f"[ChatService._broadcast_message] Channel layer error: {e}")
