from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.display_name", read_only=True)
    sender_email = serializers.CharField(source="sender.email", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "request",
            "sender",
            "sender_name",
            "sender_email",
            "content",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = [
            "id", "sender", "sender_name", "sender_email",
            "is_read", "read_at", "created_at",
        ]