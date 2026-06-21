from django.urls import path

from .views import (
    CreateCheckoutSessionView,
    BillingPortalView,
    BillingHistoryView,
    StripeWebhookView,
)

urlpatterns = [
    path("create-checkout-session/", CreateCheckoutSessionView.as_view(), name="billing-checkout"),
    path("portal/", BillingPortalView.as_view(), name="billing-portal"),
    path("history/", BillingHistoryView.as_view(), name="billing-history"),
]

webhook_urlpatterns = [
    path("stripe/", StripeWebhookView.as_view(), name="billing-webhook"),
]