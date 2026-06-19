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
    
    @staticmethod
    def update_notification_settings(user, settings_patch):
        """
        Merge settings_patch into users.settings jsonb.
        Creates the key if it doesn't exist yet.
        """
        current = user.settings or {}
        notifications = current.get("notifications", {})
        for section, prefs in settings_patch.items():
            if section not in notifications:
                notifications[section] = {}
            notifications[section].update(prefs) 
        current["notifications"] = notifications
        user.settings = current
        user.save(update_fields=["settings", "updated_at"])
        return user
        
    @staticmethod
    def get_notification_settings(user):
        settings = user.settings or {}
        return settings.get("notifications", {})
    

    @staticmethod
    def deactivate_membership(user, tenant):
        """Soft-delete: mark membership inactive for this tenant only."""
        updated = TenantMembership.objects.filter(
            user=user,
            tenant=tenant,
            is_active=True,
        ).update(is_active=False)
        return updated > 0

    


class TenantSettingsRepository:
    """All tenant-related settings DB queries"""

    @staticmethod
    def get_by_id(tenant_id):
        try:
            return Tenant.objects.select_related("plan", "usage").get(
                id=tenant_id, is_active=True
            )
        except Tenant.DoesNotExist:
            return None
        

    @staticmethod
    def slug_taken(slug, exclude_tenant_id=None):
        qs = Tenant.objects.filter(slug=slug)
        if exclude_tenant_id:
            qs = qs.exclude(id=exclude_tenant_id)
        return qs.exists()
    
    @staticmethod
    def update_workspace(tenant, fields):
        """
        Partial update — only saves fields that are in the dict.
        Returns (tenant, slug_changed: bool).
        """

        slug_changed = False
        allowed = [
            "name", "tagline", "slug", "accent_color",
            "white_label_enabled", "custom_status_labels",
        ]
        update_fields = ["updated_at"]

        for field in allowed:
            if field in fields:
                if field == "slug" and fields["slug"] != tenant.slug:
                    slug_changed = True
                setattr(tenant, field, fields[field])
                update_fields.append(field)
 
        tenant.save(update_fields=update_fields)
        return tenant, slug_changed
    

    @staticmethod
    def update_logo(tenant, logo_url):
        tenant.logo_url = logo_url
        tenant.save(update_fields=["logo_url", "updated_at"])
        return tenant
