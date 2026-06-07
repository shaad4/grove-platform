from django.urls import path
from .views import (
    MessageListCreateView,
)


urlpatterns = [
    path("requests/<uuid:request_id>/messages/", MessageListCreateView.as_view(), name="message-list-create"),
]