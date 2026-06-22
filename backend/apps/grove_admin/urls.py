from django.urls import path
from .views import (
    GroveAdminLoginView,
)


urlpatterns = [
    path("login/", GroveAdminLoginView.as_view()),
]