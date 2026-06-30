from rest_framework.permissions import BasePermission


class IsGroveSuperuser(BasePermission):
    """Grove Admin endpoints are restricted to the single provisioned superuser."""

    message = "Grove admin access required."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_superuser
        )
