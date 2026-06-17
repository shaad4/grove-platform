from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.tenants.models import TenantMembership


from .services import (
    ProfileService,
    WrongCurrentPassword
)

from .serializers import (
    DisplayNameSerializer,
    PasswordChangeSerializer,
    
)

# Create your views here.





# Helpers
def _get_role(request):
    membership = getattr(request, "tenant_membership", None)
    return membership.role if membership else None


def _require_provider(request):
    """Returns None if OK, or a 403 Response if not a provider."""

    role = _get_role(request)
    if role != TenantMembership.Role.PROVIDER:
        return Response(
            {"success": False, "message": "Provider access only."},
            status=403,
        )
    return None

def _require_tenant(request):
    """Returns tenant or a 400 Response"""
    tenant = getattr(request, "tenant", None)
    if tenant is None:
        return None, Response(
            {"success": False, "message": "Workspace not found."},
            status=400,
        )
    return tenant, None



#Profile Settings View
class ProfileSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = ProfileService.get_profile(request.user)
        return Response({"success": True, "data": data})
    
    def patch(self, request):
        user = request.user
        errors = {}
        updated = {}

        if "display_name" in request.data:
            s = DisplayNameSerializer(data=request.data)
            if s.is_valid():
                ProfileService.update_display_name(user, s.validated_data["display_name"])
                updated["display_name"] = user.display_name

            else:
                errors.update(s.errors)

        
        if "current_password" in request.data:
            s = PasswordChangeSerializer(data=request.data)

            if s.is_valid():
                try:
                    ProfileService.change_password(
                        user,
                        s.validated_data["current_password"],
                        s.validated_data["new_password"],
                    )
                    updated["password_changed"] = True
                except WrongCurrentPassword as e:
                    errors["current_password"] = [str(e)]

            else:
                errors.update(s.errors)

        if errors:
            return Response({"success": False, "errors": errors}, status=400)
        

        return Response({
            "success": True,
            "message": "Profile updated.",
            "data": updated,
        })