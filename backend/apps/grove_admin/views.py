from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.utils import set_auth_cookies
from apps.common.logger import logger

from .permissions import IsGroveSuperuser
from .serializers import (
    GroveAdminLoginSerializer,
    AdminStatsSerializer,
    AdminTenantListSerializer,
    AdminTenantDetailSerializer
)

from .services import (
    GroveAdminAuthService,
    AccountLocked,
    InvalidAdminCredentials,
    StatsService,
    TenantAdminService,
    TenantNotFound,
    PlanNotFound,


)

# Create your views here.


def _client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


class GroveAdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GroveAdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ip_address = _client_ip(request)

        try:
            admin_user = GroveAdminAuthService.authenticate(
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
                ip_address=ip_address,
            )
        except AccountLocked as e:
            return Response({"success": False, "error_type": "locked", "message": str(e)}, status=429)
        except InvalidAdminCredentials as e:
            return Response({"success": False, "error_type": "invalid_credentials", "message": str(e)}, status=400)


        refresh = RefreshToken.for_user(admin_user)

        response = Response({
            "success": True,
            "access": str(refresh.access_token),
            "admin": {"email": admin_user.email},
        })
        set_auth_cookies(response, refresh, cookie_name="grove_admin_refresh")
        return response
    
class AdminStatsView(APIView):
    permission_classes = [IsGroveSuperuser]

    def get(self, request):
        try:
            data = StatsService.get_dashboard_stats()
        except Exception as e:
            logger.error(f"[grove_admin] Failed to load stats: {e}")
            return Response({"success": False, "message": "Could not load dashboard stats."}, status=500)
        return Response({"success": True, "data": AdminStatsSerializer(data).data})


class AdminTenantListView(APIView):
    permission_classes = [IsGroveSuperuser]

    def get(self, request):
        try:
            data = StatsService.get_dashboard_stats()
        except Exception as e:
            logger.error(f"[grove_admin] Failed to load stats: {e}")
            return Response({"success": False, "message": "Could not load dashboard stats."}, status=500)
        return Response({"success": True, "data": AdminStatsSerializer(data).data})


class AdminTenantDetailView(APIView):
    permission_classes = [IsGroveSuperuser]

    def get(self, request, tenant_id):
        try:
            data = TenantAdminService.get_tenant_detail(tenant_id)
        except TenantNotFound as e:
            return Response({"success": False, "message": str(e)}, status=404)
        return Response({"success": True, "data": AdminTenantDetailSerializer(data).data})


class AdminTenantUpgradeView(APIView):
    permission_classes = [IsGroveSuperuser]

    def post(self, request, tenant_id):
        try:
            tenant = TenantAdminService.upgrade_to_pro(request.user, tenant_id)
        except TenantNotFound as e:
            return Response({"success": False, "message": str(e)}, status=404)
        except PlanNotFound as e:
            logger.error(f"[grove_admin] {e}")
            return Response({"success": False, "message": str(e)}, status=500)
        return Response({"success": True, "message": f"{tenant.name} upgraded to Pro."})
