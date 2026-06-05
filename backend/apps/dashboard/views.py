from django.shortcuts import render
from datetime import timedelta

from django.core.cache import cache
from django.db.models import Count
from django.db.models.functions import TruncDate, ExtractHour, ExtractWeekDay
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.tenants.models import TenantMembership
from apps.clients.models import Client
from apps.request_management.models import Request, RequestActivity
# Create your views here.

def _require_provider(request):
    m = getattr(request, "tenant_membership", None)
    return m is not None and m.role == TenantMembership.Role.PROVIDER


class DashboardStatsView(APIView):
    """
    GET /dashboard/stats/
 
    Single cached endpoint for the provider dashboard.
    Payload is cached in Redis per tenant (TTL 2 min).
    Cache is invalidated from RequestService / ClientService after mutations.
    """
    
    permission_classes = [IsAuthenticated]
    CACHE_TTL = 120

    def get(self, request):
        if not _require_provider(request):
            return Response({"success": False, "message": "Forbidden."}, status=403)

        tenant = request.tenant
        cache_key = f"dashboard_stats:{tenant.id}"

        cached = cache.get(cache_key)
        if cached:
            return Response({"success": True, "data": cached, "cached": True})
        

        data = self._build_stats(tenant)
        cache.set(cache_key, data, timeout=self.CACHE_TTL)
        return Response({"success": True, "data": data, "cached": False})
    

    def _build_stats(self, tenant):
        tid = tenant.id
        now = timezone.now()
        week_start = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        five_days_ago = now - timedelta(days=5)

        #counters
        total_clients = Client.objects.filter(
            tenant_id=tid,
            is_deleted=False,
            is_deactivated=False,
        ).count()

        active_requests = Request.objects.filter(
            tenant_id=tid,
            is_deleted=False,
            status__in=[
                Request.Status.RECEIVED,
                Request.Status.IN_REVIEW,
                Request.Status.IN_PROGRESS,
            ],
        ).count()


        #Deliverd this week counts

        delivered_this_week = Request.objects.filter(
            tenant_id = tid,
            status=Request.Status.DELIVERED,
            is_deleted=False,
            updated_at__gte=week_start,
        ).count()

        closed_this_week = RequestActivity.objects.filter(
            tenant_id = tid,
            event_type=RequestActivity.EventType.STATUS_CHANGE,
            metadata__to="closed",
            created_at__gte=week_start,
        ).count()

        #Inactive clients count

        active_client_ids = Request.objects.filter(
            tenant_id=tid,
            is_deleted=False,
            created_at__gte=five_days_ago,
        ).values_list("client_id", flat=True).distinct()

        inactive_clients =Client.objects.filter(
            tenant_id = tid,
            is_deleted=False,
            is_deactivated=False,
        ).exclude(id__in=active_client_ids).count()

        #Recent Requests - 5
        raw_recent = (
            Request.objects.filter(tenant_id=tid, is_deleted=False)
            .select_related("client__user")
            .order_by("-created_at")[:5]
            .values(
                "id", "title", "status", "is_urgent",
                "created_at", "updated_at",
                "client__user__display_name",
                "client__client_name",
            )
        )

        recent_requests = [
            {
                "id": str(r["id"]),
                "title": r["title"],
                "status": r["status"],
                "is_urgent": r["is_urgent"],
                "created_at": r["created_at"].isoformat(),
                "updated_at": r["updated_at"].isoformat(),
                "client_name": r["client__user__display_name"] or r["client__client_name"] or "Unknown",
            }
            for r in raw_recent
        ]

        #30-Day volume chart

        received_by_day = (
            Request.objects.filter(
                tenant_id = tid, is_deleted=False,
                created_at__gte=thirty_days_ago,
            )
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
        )

        delivered_by_day = (
            RequestActivity.objects.filter(
                tenant_id=tid,
                event_type=RequestActivity.EventType.STATUS_CHANGE,
                metadata__to__in=["delivered", "closed"],
                created_at__gte=thirty_days_ago,
            )
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
        )

        received_map = {r["day"]: r["count"] for r in received_by_day}
        delivered_map = {r["day"]: r["count"] for r in delivered_by_day}

        volume_chart = [
            {
                "date" : (now - timedelta(days=29 -i)).date().isoformat(),
                "received": received_map.get((now - timedelta(days=29 -i )).date(),0),
                "delivered": delivered_map.get((now - timedelta(days=29 -i )).date(), 0)
            }
            for i in range(30)
        ]

        #Busiest Time Heatmap

        heatmap = list(
            Request.objects.filter(
                tenant_id=tid, is_deleted=False,
                created_at__gte=thirty_days_ago,
            )
            .annotate(
                dow=ExtractWeekDay("created_at"),
                hour=ExtractHour("created_at"),
            )
            .values("dow","hour")
            .annotate(count=Count("id"))
        )

        #Status Breakdown

        status_breakdown = list(
            Request.objects.filter(
                tenant_id = tid,
                is_deleted=False,
                status__in=[
                    Request.Status.RECEIVED,
                    Request.Status.IN_REVIEW,
                    Request.Status.IN_PROGRESS,
                ],
            )
            .values("status")
            .annotate(count=Count("id"))
        )

        return {
            "stats": {
                "total_clients": total_clients,
                "open_requests": active_requests,
                "delivered_this_week": delivered_this_week + closed_this_week,
                "inactive_clients": inactive_clients,
            },
            "status_breakdown": status_breakdown,
            "recent_requests": recent_requests,
            "volume_chart": volume_chart,
            "heatmap": heatmap,
        }

class SidebarBadgesView(APIView):
    permission_classes = [IsAuthenticated]

    CACHE_TTL = 120

    def get(self, request):
        if not _require_provider(request):
            return Response(
                {"success": False, "message": "Forbidden."}, status=403,
            )
        
        tenant = request.tenant

        cache_key = f"sidebar_badges:{tenant.id}"

        cached = cache.get(cache_key)
        if cached:
            return Response(
                {
                    "success": True,
                    "data": cached,
                    "cached" : True,
                }
            )
        
        tid = tenant.id

        data = {
            "clients": Client.objects.filter(
                tenant_id=tid,
                is_deleted=False,
                is_deactivated=False,
            ).count(),
            "requests": Request.objects.filter(
                tenant_id=tid,
                is_deleted=False,
                status__in=[
                    Request.Status.RECEIVED,
                    Request.Status.IN_REVIEW,
                    Request.Status.IN_PROGRESS,
                ],
            ).count(),
        }

        cache.set(cache_key, data, timeout=self.CACHE_TTL)

        return Response(
            {
                "success" : True,
                "data" : data,
                "cached" : False,
            }
        )



















