import pytest
from rest_framework import status
from apps.chat.models import Message
from apps.request_management.models import Request

@pytest.mark.django_db
class TestChatViews:
    def test_message_list_create_view(self, provider_client, tenant, client_profile, provider_user):
        req = Request.objects.create(
            tenant=tenant,
            client=client_profile,
            provider=provider_user,
            title="Chat Request",
            description="Testing chat views"
        )

        url = f"/api/requests/{req.id}/messages/"
        # Create message
        data = {
            "content": "Hello client!"
        }
        response = provider_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        assert response.data["message"]["content"] == "Hello client!"

        # List messages
        response = provider_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        assert len(response.data["results"]) == 1

    def test_mark_messages_read_view(self, client_client, tenant, client_profile, provider_user):
        req = Request.objects.create(
            tenant=tenant,
            client=client_profile,
            provider=provider_user,
            title="Chat Request",
            description="Testing chat views"
        )
        # Create an unread message from provider
        Message.objects.create(
            request=req,
            tenant=tenant,
            sender=provider_user,
            content="Message from provider",
            is_read=False
        )

        url = f"/api/requests/{req.id}/messages/mark-read/"
        response = client_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True

        unread_count = Message.objects.filter(request=req, is_read=False).count()
        assert unread_count == 0
