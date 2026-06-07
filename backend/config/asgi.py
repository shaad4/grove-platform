import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from config.ws_routing import websocket_urlpatterns
from apps.tenants.ws_middleware import JWTTenantAuthMiddleware

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

django_asgi_app = get_asgi_application()



application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTTenantAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})