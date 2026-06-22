from django.urls import path
from .views import (
    GroveAdminLoginView,
    AdminStatsView,
    AdminTenantListView,
    
)


urlpatterns = [
    path("login/", GroveAdminLoginView.as_view()),
    path("api/stats/", AdminStatsView.as_view()),
    path("api/tenants/", AdminTenantListView.as_view()),
]