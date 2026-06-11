from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.common.logger import logger
from .models import Notification


def get_feed_group_name(user_id):
    return f"feed_{user_id}"


def create_notification(
        *,
        tenant,
        recipient,
        event_type,
        title,
        body,
        related_request=None,
        related_client=None,
        new_status=None,
):
    """
    Creates a Notification record and immediately pushes it over WebSocket
    to the recipient's personal feed channel group.

    Call this from any service — status change, new message, delivery, invite.
    Always use keyword arguments.
    """
    notification = Notification.objects.create(
        tenant=tenant,
        recipient=recipient,
        event_type=event_type,
        title=title,
        body=body,
        related_request=related_request,
        related_client=related_client,
    )

    payload = {
        "type": "feed.notification", # routes to handler in consumer
        "notification_id": str(notification.id),
        "event_type": notification.event_type,
        "title": notification.title,
        "body": notification.body,
        "related_request_id": str(related_request.id) if related_request else None,
        "related_client_id":  str(related_client.id)  if related_client  else None,
        "is_read": False,
        "created_at": notification.created_at.isoformat(),
        "new_status" : new_status,
        "updated_at": related_request.updated_at.isoformat() if related_request else None,

    }

    group_name = get_feed_group_name(str(recipient.id))

    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(group_name, payload)
    except Exception as e:
        logger.error(f"[create_notification] WebSocket push failed for {recipient.email}: {e}")


    return notification



def push_activity(*, activity, provider_id):
    """
    Pushes a RequestActivity event over WebSocket to the provider's feed group.
    No DB write — activity record already exists.
    """

    payload = {
        "type": "feed.activity",
        "id": str(activity.id),
        "event_type": activity.event_type,
        "description": activity.description,
        "actor_source": activity.actor_source,
        "actor": activity.actor.display_name if activity.actor else None,
        "request_id": str(activity.request_id),
        "request_title": activity.request.title if hasattr(activity, "request") else None,
        "metadata": activity.metadata,
        "created_at": activity.created_at.isoformat(),
    }

    group_name = get_feed_group_name(str(provider_id))

    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(group_name, payload)
    except Exception as e:
        logger.error(f"[push_activity] WebSocket push failed for provider {provider_id}: {e}")