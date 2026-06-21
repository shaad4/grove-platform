import stripe
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from apps.tenants.models import TenantMembership

from .services import(
    BillingService,
    StripeConfigError,
    CheckoutSessionError,
    PortalSessionError,
)

from .repositories import BillingHistoryRepository
from .tasks import sync_billing_event
from apps.common.logger import logger


def _is_provider(request):
    m = getattr(request, "tenant_membership", None)
    return m is not None and m.role == TenantMembership.Role.PROVIDER


class CreateCheckoutSessionView(APIView):
    """Provider clicks 'Upgrade to Pro'  returns a Stripe Checkout URL to redirect to"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_provider(request):
            return Response({"success": False, "message": "Forbidden."}, status=403)
        
        tenant = request.tenant

        success_url = request.data.get("success_url") or f"{settings.FRONTEND_URL}/dashboard?upgraded=true"
        cancel_url = request.data.get("cancel_url") or f"{settings.FRONTEND_URL}/upgrade"

        try:
            checkout_url = BillingService.create_checkout_session(
                tenant=tenant,
                user_email=request.user.email,
                success_url=success_url,
                cancel_url=cancel_url,
            )
        except StripeConfigError as e:
            return Response({"success": False, "message": str(e)}, status=503)
        except CheckoutSessionError as e:
            return Response({"success": False, "message": str(e)}, status=502)

        return Response({"success": True, "data": {"checkout_url": checkout_url}})
    

class BillingPortalView(APIView):
    """Provider clicks 'Manage Billing' returns a Stripe Customer Portal URL."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_provider(request):
            return Response({"success": False, "message": "Forbidden."}, status=403)

        tenant = request.tenant
        return_url = request.data.get("return_url") or f"{settings.FRONTEND_URL}/dashboard"

        try:
            portal_url = BillingService.create_portal_session(tenant=tenant, return_url=return_url)
        except PortalSessionError as e:
            return Response({"success": False, "message": str(e)}, status=400)

        return Response({"success": True, "data": {"portal_url": portal_url}})


class BillingHistoryView(APIView):
    """Returns the invoice history for the current tenant."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_provider(request):
            return Response({"success": False, "message": "Forbidden."}, status=403)

        history = BillingHistoryRepository.get_for_tenant(request.tenant.id)

        data = [
            {
                "id": str(h.id),
                "amount": str(h.amount),
                "currency": h.currency,
                "status": h.status,
                "period_start": h.period_start,
                "period_end": h.period_end,
                "created_at": h.created_at,
            }
            for h in history
        ]

        return Response({"success": True, "data": data})


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    """
    Receives Stripe webhook events. No auth — verified via signature instead.
    Handles: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            logger.error(f"[StripeWebhookView] Signature verification failed: {e}")
            return Response({"success": False}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event["type"]
        event_data = event["data"]["object"]

        if event_type == "checkout.session.completed":
            BillingService.handle_checkout_completed(event_data)
        elif event_type == "customer.subscription.deleted":
            BillingService.handle_subscription_deleted(event_data)
        elif event_type == "invoice.payment_failed":
            BillingService.handle_payment_failed(event_data)
        else:
            logger.info(f"[StripeWebhookView] Unhandled event type: {event_type}")
            return Response({"success": True})
        
        sync_billing_event.delay(
            event_type,
            event_data.to_dict_recursive(),
        )

        return Response({"success" : True})
    