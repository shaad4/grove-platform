import secrets

from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from apps.tenants.models import TenantMembership
from apps.clients.models import Client
from apps.request_management.models import Request
from apps.users.services import PasswordResetService
from apps.notifications.tasks import send_password_reset_email
from apps.common.logger import logger

from .repositories import (
    UserAdminRepository,
    TenantAdminRepository,
)

# custom exceptions
class InvalidAdminCredentials(Exception):
    pass

class AccountLocked(Exception):
    pass

class TenantNotFound(Exception):
    pass

class UserNotFound(Exception):
    pass

class PlanNotFound(Exception):
    pass

class InvalidLimitValue(Exception):
    pass


class GroveAdminAuthService:

    LOCKOUT_THRESHOLD = 5
    LOCKOUT_SECONDS = 15 * 60

    @staticmethod
    def _attempts_key(ip):
        return f"grove_admin_attempts:{ip}"
    
    @staticmethod
    def _lockout_key(ip):
        return f"grove_admin_lockout:{ip}"
    
    @staticmethod
    def authenticate(email, password, ip_address):
        if cache.get(GroveAdminAuthService._lockout_key(ip_address)):
            raise AccountLocked("Too many failed attempts. Try again latter")
        
        expected_email = settings.GROVE_ADMIN_EMAIL.lower().strip()
        expected_password = settings.GROVE_ADMIN_PASSWORD

        valid = (
            secrets.compare_digest(email.lower().strip(), expected_email)
            and secrets.compare_digest(password, expected_password)
        )

        if not valid:
            attempts_key = GroveAdminAuthService._attempts_key(ip_address)
            attempts = (cache.get(attempts_key) or 0) + 1
            cache.set(attempts_key, attempts, timeout=GroveAdminAuthService.LOCKOUT_SECONDS)

            if attempts >= GroveAdminAuthService.LOCKOUT_THRESHOLD:
                cache.set(GroveAdminAuthService._lockout_key(ip_address), True, timeout=GroveAdminAuthService.LOCKOUT_SECONDS)
                logger.warning(f"[grove_admin_auth] IP {ip_address} locked after {attempts} failed attempts.")
            else:
                logger.warning(f"[grove_admin_auth] Failed login attempt {attempts} from IP {ip_address}.")

            raise InvalidAdminCredentials("Invalid email or password.")
        
        cache.delete(GroveAdminAuthService._attempts_key(ip_address))
        cache.delete(GroveAdminAuthService._lockout_key(ip_address))

        admin_user = UserAdminRepository.get_or_create_admin_user(expected_email)
        logger.info(f"[grove_admin_auth] Successful admin login from IP {ip_address}.")
        return admin_user

class StatsService:

    @staticmethod
    def get_dashboard_stats():
        now = timezone.now()
        week_ago = now - timezone.timedelta(days=7)
        two_weeks_ago = now - timezone.timedelta(days=14)

        total_tenants = TenantAdminRepository.count_total()
        total_users = UserAdminRepository.count_total_users()
        total_requests = Request.objects.filter(is_deleted=False).count()

        free_count = TenantAdminRepository.count_by_plan("free")
        pro_count = TenantAdminRepository.count_by_plan("pro")

        signups_this_week = TenantAdminRepository.signup_count_since(week_ago)
        signups_prior_week = TenantAdminRepository.signup_count_between(two_weeks_ago, week_ago)
        signup_delta = signups_this_week - signups_prior_week

        recent_tenants = TenantAdminRepository.recent(limit=5)

        at_limit = []
        for tenant, usage in TenantAdminRepository.free_tenants_with_usage():
            if usage is None:
                continue
            client_limit = tenant.effective_client_limit
            request_limit = tenant.plan.request_limit if tenant.plan else None
            client_maxed = client_limit != -1 and usage.client_count >= client_limit
            request_maxed = request_limit not in (None, -1) and usage.active_request_count >= request_limit
            if client_maxed or request_maxed:
                at_limit.append(tenant)

        return {
            "total_tenants": total_tenants,
            "total_users": total_users,
            "total_requests": total_requests,
            "free_count": free_count,
            "pro_count": pro_count,
            "signups_this_week": signups_this_week,
            "signup_delta": signup_delta,
            "recent_tenants": recent_tenants,
            "tenants_at_limit": at_limit,
        }





