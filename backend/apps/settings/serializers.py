import re
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.tenants.models import Tenant

SLUG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$")
HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")
 
RESERVED_SLUGS = {
    "www", "api", "admin", "grove", "app", "mail",
    "static", "assets", "cdn", "support", "help", "billing",
}
 
STATUS_KEYS = {"received", "in_review", "in_progress", "delivered", "closed"}
 
VALID_SUMMARY_DAYS = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}

# Profile

class DisplayNameSerializer(serializers.Serializer):
    display_name = serializers.CharField(min_length=2, max_length=60)

    def validate_display_name(self, value):
        return value.strip()
    

class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        if value.isdigit():
            raise serializers.ValidationError("Password cannot be entirely numeric.")
        validate_password(value)
        return value
 
    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return data

