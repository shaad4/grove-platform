from django.urls import path
from .views import DashboardStatsView, SidebarBadgesView, ActivityFeedView, ActivityExportView

urlpatterns = [
    path("stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("badges/", SidebarBadgesView.as_view(), name="sidebar-badges"),
    path("activity/", ActivityFeedView.as_view(), name="activity-feed"),
    path("activity/export/", ActivityExportView.as_view(), name="activity-export"),

]