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