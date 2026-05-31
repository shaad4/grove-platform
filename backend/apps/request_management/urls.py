from django.urls import path
from .views import (
    RequestListCreateView,
    RequestDetailView,
    RequestStatusView,
    RequestFlagView,
    RequestDueDateView,
    RequestActivityView,
    InternalNoteView,
    DeliveryView,
    PresignedUploadView,
    ConfirmUploadView,

)


urlpatterns = [
    path("", RequestListCreateView.as_view(), name="request-list-create"),
    path("<uuid:request_id>/", RequestDetailView.as_view(), name="request-detail"),
    path("<uuid:request_id>/status/", RequestStatusView.as_view(), name="request-status"),
    path("<uuid:request_id>/flag/", RequestFlagView.as_view(), name="request-flag"),
    path("<uuid:request_id>/due-date/", RequestDueDateView.as_view(), name="request-due-date"),
 
    path("<uuid:request_id>/activity/", RequestActivityView.as_view(),   name="request-activity"),

    path("<uuid:request_id>/notes/", InternalNoteView.as_view(), name="request-notes"),

    path("<uuid:request_id>/deliveries/", DeliveryView.as_view(), name="request-deliveries"),

    path("files/upload/presign/",PresignedUploadView.as_view(), name="file-presign"),
    path("files/upload/confirm/", ConfirmUploadView.as_view(), name="file-confirm"),


]
