from apps.chat.routing import websocket_urlpatterns as chat_ws

websocket_urlpatterns = [
    *chat_ws,
]