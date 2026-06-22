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
    AdminPlanListView,



)


urlpatterns = [
    path("login/", GroveAdminLoginView.as_view()),
    path("stats/", AdminStatsView.as_view()),
    path("tenants/", AdminTenantListView.as_view()),
    path("tenants/<uuid:tenant_id>/", AdminTenantDetailView.as_view()),
    path("tenants/<uuid:tenant_id>/upgrade/", AdminTenantUpgradeView.as_view()),
    path("tenants/<uuid:tenant_id>/downgrade/", AdminTenantDowngradeView.as_view()),
    path("tenants/<uuid:tenant_id>/suspend/", AdminTenantSuspendView.as_view()),
    path("tenants/<uuid:tenant_id>/unsuspend/", AdminTenantUnsuspendView.as_view()),
    path("tenants/<uuid:tenant_id>/override-limit/", AdminTenantOverrideLimitView.as_view()),

    path("users/", AdminUserListView.as_view()),
    path("users/<uuid:user_id>/send-password-reset/", AdminUserSendPasswordResetView.as_view()),
    path("users/<uuid:user_id>/deactivate/", AdminUserDeactivateView.as_view()),
    path("plans/", AdminPlanListView.as_view()),

]