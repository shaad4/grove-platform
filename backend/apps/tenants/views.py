from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Tenant

# Create your views here.


class ValidateTenantView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        slug = request.query_params.get("slug")
        if not slug:
            return Response({"valid": False}, status=400)
        exists = Tenant.objects.filter(slug=slug, is_active=True).exists()
        return Response({"valid": exists})


class TenantPublicInfoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return Response(
                {"success": False, "message": "No workspace found."}, status=404
            )
        return Response(
            {
                "name": tenant.name,
                "slug": tenant.slug,
                "logo_url": tenant.logo_url,
                "tagline": tenant.tagline,
                "accent_color": tenant.accent_color,
                "white_label_enabled": tenant.white_label_enabled,
            }
        )
