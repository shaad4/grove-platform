from django.urls import path
from .views import (
    GroveAdminLoginView,
    AdminStatsView,
    AdminTenantListView,
    AdminTenantDetailView,
    AdminTenantUpgradeView,
    AdminTenantDowngradeView,
    
)


urlpatterns = [
    path("login/", GroveAdminLoginView.as_view()),
    path("api/stats/", AdminStatsView.as_view()),
    path("api/tenants/", AdminTenantListView.as_view()),
    path("api/tenants/<uuid:tenant_id>/", AdminTenantDetailView.as_view()),
    path("api/tenants/<uuid:tenant_id>/upgrade/", AdminTenantUpgradeView.as_view()),
    path("api/tenants/<uuid:tenant_id>/downgrade/", AdminTenantDowngradeView.as_view()),

]