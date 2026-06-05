from django.urls import path
from .views import DashboardStatsView, SidebarBadgesView

urlpatterns = [
    path("stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("badges/", SidebarBadgesView.as_view(), name="sidebar-badges"),
]