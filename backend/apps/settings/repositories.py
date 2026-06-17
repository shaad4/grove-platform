from apps.tenants.models import Tenant, TenantMembership
from apps.users.models import User



class UserSettingsRepository:
    """All user-related settings DB quires"""

    @staticmethod
    def get_by_id(user_id):
        try:
            return User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return None
        
    @staticmethod
    def update_display_name(user, display_name):
        user.display_name = display_name
        user.save(update_fields=["display_name", "updated_at"])

        return user
    
    @staticmethod
    def update_avatar(user, avatar_url):
        user.avatar_url = avatar_url
        user.save(update_fields = ["avatar_url", "updated_at"])
        return user
    
    @staticmethod
    def update_password(user, new_password):
        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])
        return user
    