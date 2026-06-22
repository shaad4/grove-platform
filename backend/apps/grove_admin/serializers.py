from rest_framework import serializers

class GroveAdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()



class AdminStatsSerializer(serializers.Serializer):
    def to_representation(self, data):
        return {
            "total_tenants": data["total_tenants"],
            "total_users": data["total_users"],
            "total_requests": data["total_requests"],
            "free_count": data["free_count"],
            "pro_count": data["pro_count"],
            "signups_this_week": data["signups_this_week"],
            "signup_delta": data["signup_delta"],
            "recent_tenants": [
                {
                    "id": str(t.id),
                    "name": t.name,
                    "slug": t.slug,
                    "plan": t.plan.name if t.plan else None,
                    "joined_at": t.created_at,
                }
                for t in data["recent_tenants"]
            ],
            "tenants_at_limit": [
                {"id": str(t.id), "name": t.name, "slug": t.slug}
                for t in data["tenants_at_limit"]
            ],
        }
    
class AdminTenantListSerializer(serializers.Serializer):
    def to_representation(self, row):
        tenant, usage = row["tenant"], row["usage"]
        return {
            "id": str(tenant.id),
            "name": tenant.name,
            "slug": tenant.slug,
            "plan": tenant.plan.name if tenant.plan else None,
            "client_count": usage.client_count if usage else 0,
            "client_limit": tenant.effective_client_limit,
            "request_count": usage.active_request_count if usage else 0,
            "request_limit": tenant.plan.request_limit if tenant.plan else None,
            "is_suspended": tenant.is_suspended,
            "created_at": tenant.created_at,
        }
    

class AdminTenantDetailSerializer(serializers.Serializer):
    def to_representation(self, data):
        tenant, usage = data["tenant"], data["usage"]
        return {
            "id": str(tenant.id),
            "name": tenant.name,
            "slug": tenant.slug,
            "logo_url": tenant.logo_url,
            "provider_email": data["provider_email"],
            "plan": tenant.plan.name if tenant.plan else None,
            "is_suspended": tenant.is_suspended,
            "created_at": tenant.created_at,
            "client_count": usage.client_count if usage else 0,
            "client_limit": tenant.effective_client_limit,
            "request_count": usage.active_request_count if usage else 0,
            "request_limit": tenant.plan.request_limit if tenant.plan else None,
            "clients": [
                {
                    "id": str(c.id),
                    "name": c.client_name or (c.user.display_name if c.user else None),
                    "email": c.client_email or (c.user.email if c.user else None),
                }
                for c in data["clients"]
            ],
        }
    
class OverrideLimitSerializer(serializers.Serializer):
    limit = serializers.IntegerField(required=False, allow_null=True)

