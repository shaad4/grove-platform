from django.urls import path
from .views import (
    GroveAdminLoginView,
    AdminStatsView,
    AdminTenantListView,
    AdminTenantDetailView,
    AdminTenantUpgradeView,
    AdminTenantDowngradeView,
    AdminTenantSuspendView,
    AdminTenantUnsuspendView,
    AdminTenantOverrideLimitView,
    AdminUserListView,
    AdminUserSendPasswordResetView,
    AdminUserDeactivateView,
    


)


urlpatterns = [
    path("login/", GroveAdminLoginView.as_view()),
    path("api/stats/", AdminStatsView.as_view()),
    path("api/tenants/", AdminTenantListView.as_view()),
    path("api/tenants/<uuid:tenant_id>/", AdminTenantDetailView.as_view()),
    path("api/tenants/<uuid:tenant_id>/upgrade/", AdminTenantUpgradeView.as_view()),
    path("api/tenants/<uuid:tenant_id>/downgrade/", AdminTenantDowngradeView.as_view()),
    path("api/tenants/<uuid:tenant_id>/suspend/", AdminTenantSuspendView.as_view()),
    path("api/tenants/<uuid:tenant_id>/unsuspend/", AdminTenantUnsuspendView.as_view()),
    path("api/tenants/<uuid:tenant_id>/override-limit/", AdminTenantOverrideLimitView.as_view()),

    path("api/users/", AdminUserListView.as_view()),
    path("api/users/<uuid:user_id>/send-password-reset/", AdminUserSendPasswordResetView.as_view()),
    path("api/users/<uuid:user_id>/deactivate/", AdminUserDeactivateView.as_view()),

]