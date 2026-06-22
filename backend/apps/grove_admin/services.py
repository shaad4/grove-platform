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

