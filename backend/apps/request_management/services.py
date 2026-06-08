import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.tenants.models import TenantUsage
from django.core.cache import cache  
from apps.common.logger import logger

from apps.notifications.utils import create_notification
from apps.notifications.models import Notification

from .models import Request, RequestActivity, File
from .repositories import (
    RequestRepository,
    RequestActivityRepository,
    InternalNoteRepository,
    DeliveryRepository,
    FileRepository,
)

#custom Exceptions
class RequestNotFound(Exception):
    pass
 
class RequestLimitExceeded(Exception):
    pass
 
class ForbiddenStatusTransition(Exception):
    pass
 
class RequestNotEditable(Exception):
    pass
 
class FileNotFound(Exception):
    pass
 
class S3PresignError(Exception):
    pass

class DeliveryNotFound(Exception):
    pass

class InvalidReviewAction(Exception):
    pass


VALID_TRANSITIONS = {
    Request.Status.RECEIVED:    [Request.Status.IN_REVIEW,   Request.Status.CLOSED],
    Request.Status.IN_REVIEW:   [Request.Status.IN_PROGRESS, Request.Status.RECEIVED, Request.Status.CLOSED],
    Request.Status.IN_PROGRESS: [Request.Status.DELIVERED,   Request.Status.IN_REVIEW],
    Request.Status.DELIVERED:   [Request.Status.CLOSED,      Request.Status.IN_PROGRESS],
    Request.Status.CLOSED:      [],  # terminal
}

class RequestService:

    @staticmethod
    @transaction.atomic
    def create_request(tenant, client, provider, title, description):
        """Client submits a new request."""

        usage = TenantUsage.objects.select_for_update().get(tenant=tenant)

        plan = tenant.plan
        limit = plan.request_limit 

        if limit != -1 and usage.active_request_count >= limit:
            raise RequestLimitExceeded(
                f"Active request limit of {limit} reached. "
                "Upgrade to Pro for unlimited requests."
            )
        
        request_obj = RequestRepository.create(
            tenant=tenant,
            client=client,
            provider=provider,
            title=title,
            description=description,
        )

        RequestActivityRepository.log(
            request_obj=request_obj,
            event_type=RequestActivity.EventType.REQUEST_CREATED,
            description=f"Request submitted by {client.client_name or 'client'}.",
            actor=client.user,
            actor_source=RequestActivity.ActorSource.USER,
        )

        TenantUsage.objects.filter(tenant=tenant).update(
            active_request_count=TenantUsage.objects.values_list(
                "active_request_count", flat=True
            ).get(tenant=tenant) + 1,
            total_requests_lifetime=TenantUsage.objects.values_list(
                "total_requests_lifetime", flat=True
            ).get(tenant=tenant) + 1,
        )

        cache.delete(f"dashboard_stats:{tenant.id}")
        cache.delete(f"sidebar_badges:{tenant.id}")

        return request_obj
    

    @staticmethod
    @transaction.atomic
    def update_status(request_id, tenant, actor, new_status):
        """Provider moves a request through the pipeline."""

        request_obj = RequestRepository.get_by_id(request_id, tenant.id)
        if not request_obj:
            raise RequestNotFound("Request not found.")
 
        current = request_obj.status
        allowed = VALID_TRANSITIONS.get(current, [])
 
        if new_status not in allowed:
            raise ForbiddenStatusTransition(
                f"Cannot move from '{current}' to '{new_status}'."
            )
        
        old_status = current
        RequestRepository.update_status(request_obj, new_status)
 
        RequestActivityRepository.log(
            request_obj=request_obj,
            event_type=RequestActivity.EventType.STATUS_CHANGE,
            description=f"Status changed from '{old_status}' to '{new_status}'.",
            actor=actor,
            actor_source=RequestActivity.ActorSource.USER,
            metadata={"from": old_status, "to": new_status},
        )

        # Decrement active count when closed or delivered
        if new_status in [Request.Status.CLOSED, Request.Status.DELIVERED]:
            usage = TenantUsage.objects.get(tenant=tenant)
            if usage.active_request_count > 0:
                TenantUsage.objects.filter(tenant=tenant).update(
                    active_request_count=usage.active_request_count - 1
                )

         # Increment delivered count
        if new_status == Request.Status.DELIVERED:
            usage = TenantUsage.objects.get(tenant=tenant)
            TenantUsage.objects.filter(tenant=tenant).update(
                total_delivered_lifetime=usage.total_delivered_lifetime + 1
            )

        # Restore active count if coming back from closed/delivered
        if old_status in [Request.Status.CLOSED, Request.Status.DELIVERED] and \
           new_status not in [Request.Status.CLOSED, Request.Status.DELIVERED]:
            usage = TenantUsage.objects.get(tenant=tenant)
            TenantUsage.objects.filter(tenant=tenant).update(
                active_request_count=usage.active_request_count + 1
            )

        cache.delete(f"dashboard_stats:{tenant.id}")
        cache.delete(f"sidebar_badges:{tenant.id}")

        # Notify the client that their request status changed

        try:
            client_user = request_obj.client.user
            if client_user and client_user != actor:
                create_notification(
                    tenant=tenant,
                    recipient=client_user,
                    event_type=Notification.EventType.STATUS_CHANGE,
                    title="Your request status was updated",
                    body=f'"{request_obj.title}" moved to {new_status.replace("_", " ").title()}.',
                    related_request=request_obj,
                    related_client=request_obj.client,
                )
        except Exception as e:
                logger.error(f"[update_status] Notification failed: {e}")

 
        return request_obj


    @staticmethod
    @transaction.atomic
    def edit_request(request_id, tenant, client_id, title=None, description=None):
        """Client can edit only while status is RECEIVED."""

        request_obj = RequestRepository.get_by_id_for_client(request_id, tenant.id, client_id)

        if not request_obj:
            raise RequestNotFound("Request not found.")
        
        if request_obj.status != Request.Status.RECEIVED:
            raise RequestNotEditable(
                "Request can no longer be edited once it has been reviewed."
            )

        RequestRepository.update_content(request_obj, title=title, description=description)
        return request_obj
    

    @staticmethod
    def set_urgent(request_id, tenant, actor, is_urgent):
        request_obj = RequestRepository.get_by_id(request_id, tenant.id)

        if not request_obj:
            raise RequestNotFound("Request not found.")
        
        RequestRepository.set_urgent(request_obj, is_urgent)

        RequestActivityRepository.log(
            request_obj=request_obj,
            event_type=RequestActivity.EventType.STATUS_CHANGE,
            description=f"Request {'flagged as urgent' if is_urgent else 'unflagged'}.",
            actor=actor,
            actor_source=RequestActivity.ActorSource.USER,
            metadata={"is_urgent": is_urgent},
        )
        return request_obj
    

    @staticmethod
    def set_due_date(request_id, tenant, actor, due_date):
        request_obj = RequestRepository.get_by_id(request_id, tenant.id)
        if not request_obj:
            raise RequestNotFound("Request not found.")
        RequestRepository.set_due_date(request_obj, due_date)
        return request_obj
    


    @staticmethod
    @transaction.atomic
    def add_internal_note(request_id, tenant, user, content):
        request_obj = RequestRepository.get_by_id(request_id, tenant.id)
        if not request_obj:
            raise RequestNotFound("Request not found.")
 
        note = InternalNoteRepository.create(
            request_obj=request_obj,
            user=user,
            content=content,
        )
 
        RequestActivityRepository.log(
            request_obj=request_obj,
            event_type=RequestActivity.EventType.NOTE_ADDED,
            description="Internal note added.",
            actor=user,
            actor_source=RequestActivity.ActorSource.USER,
        )
 
        return note
 

    @staticmethod
    @transaction.atomic
    def create_delivery(request_id, tenant, provider, message=None, links=None, file_ids=None):
        """
        Provider delivers a request.
        file_ids = list of File UUIDs already uploaded via the presigned-URL flow.
        """
        request_obj = RequestRepository.get_by_id(request_id, tenant.id)
        if not request_obj:
            raise RequestNotFound("Request not found.")
 
        delivery = DeliveryRepository.create(
            request_obj=request_obj,
            created_by=provider,
            message=message,
            links=links,
        )
 
        # Attach previously uploaded files to this delivery
        if file_ids:
            files = File.objects.filter(
                id__in=file_ids,
                tenant=tenant,
                request=request_obj,
                is_deleted=False,
            )
            files.update(delivery=delivery, is_delivery_file=True)
 
        RequestActivityRepository.log(
            request_obj=request_obj,
            event_type=RequestActivity.EventType.DELIVERY_CREATED,
            description=f"Delivery #{delivery.delivery_number} created.",
            actor=provider,
            actor_source=RequestActivity.ActorSource.USER,
            metadata={"delivery_id": str(delivery.id)},
        )
 
        return delivery
    
    def review_delivery(request_id, delivery_id, tenant, client, action, message=None):
        """
        Client approves or requests rework on a delivered request.
        approve  → status becomes closed
        rework   → status becomes in_progress
        """

        request_obj = RequestRepository.get_by_id_for_client(request_id, tenant.id, client.id)
        if not request_obj:
            raise RequestNotFound("Request not found.")
        
        if request_obj.status != Request.Status.DELIVERED:
            raise ForbiddenStatusTransition("Only delivered requests can be reviewed.")
        
        delivery = DeliveryRepository.get_by_id(delivery_id, request_id, tenant.id)
        if not delivery:
            raise DeliveryNotFound("Delivery not found")
        
        if action == "approve":
            new_status = Request.Status.CLOSED
            event_type = RequestActivity.EventType.STATUS_CHANGE
            activity_description = "Client approved the delivery. Request closed."
        else:
            new_status = Request.Status.IN_PROGRESS
            event_type = RequestActivity.EventType.STATUS_CHANGE
            activity_description = (
                 f"Client requested rework. Message: {message}"
                if message else "Client requested rework."
            )

        old_status = request_obj.status
        RequestRepository.update_status(request_obj, new_status)

        RequestActivityRepository.log(
            request_obj=request_obj,
            event_type=event_type,
            description=activity_description,
            actor=client.user,
            actor_source=RequestActivity.ActorSource.USER,
            metadata={
                "from": old_status,
                "to": new_status,
                "delivery_id": str(delivery_id),
                "action": action,
                **({"rework_message": message} if message else {}),
            },
        )

        if new_status == Request.Status.CLOSED:
            usage = TenantUsage.objects.get(tenant=tenant)
            updates = {"total_delivered_lifetime" : usage.total_delivered_lifetime + 1}
            if usage.active_request_count > 0:
                updates["active_request_count"] = usage.active_request_count - 1
            TenantUsage.objects.filter(tenant=tenant).update(**updates)

        if new_status == Request.Status.IN_PROGRESS:
            usage = TenantUsage.objects.get(tenant=tenant)
            TenantUsage.objects.filter(tenant=tenant).update(
                active_request_count=usage.active_request_count + 1
            ) 

        cache.delete(f"dashboard_stats:{tenant.id}")
        cache.delete(f"sidebar_badges:{tenant.id}")

        return request_obj

    
class FileService:
 
    @staticmethod
    def generate_presigned_upload_url(tenant_id, request_id, file_name, file_type, uploaded_by_id):
        """
        Returns a presigned S3 POST URL.
        """

        s3 = boto3.client(
            "s3",
            region_name=settings.AWS_S3_REGION_NAME,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
 
        extension = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
        s3_key = f"tenants/{tenant_id}/requests/{request_id}/{timezone.now().strftime('%Y%m%d%H%M%S')}_{file_name}"
 
        try:
            presigned = s3.generate_presigned_post(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=s3_key,
                Fields={"Content-Type": file_type},
                Conditions=[
                    {"Content-Type": file_type},
                    ["content-length-range", 1, 50 * 1024 * 1024],  # max 50 MB
                ],
                ExpiresIn=300,  # 5 minutes
            )
        except ClientError as e:
            raise S3PresignError(f"Could not generate upload URL: {e}")
 
        return {
            "upload_url": presigned["url"],
            "fields":     presigned["fields"],
            "s3_key":     s3_key,
            "extension":  extension,
        }


    @staticmethod
    def confirm_upload(tenant, request_id, uploaded_by, file_name,
                       s3_key, file_size_bytes, file_type):
        """
        Called by the frontend after a successful S3 upload.
        Creates the File record pointing at the now-live S3 object.
        """
        request_obj = RequestRepository.get_by_id(request_id, tenant.id)
        if not request_obj:
            raise RequestNotFound("Request not found.")
 
        extension = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
        file_url  = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{s3_key}"
 
        file_obj = FileRepository.create(
            tenant=tenant,
            request_obj=request_obj,
            uploaded_by=uploaded_by,
            file_name=file_name,
            s3_key=s3_key,
            file_url=file_url,
            file_size_bytes=file_size_bytes,
            file_type=file_type,
            file_extension=extension,
        )
 
        RequestActivityRepository.log(
            request_obj=request_obj,
            event_type=RequestActivity.EventType.FILE_UPLOADED,
            description=f"File '{file_name}' uploaded.",
            actor=uploaded_by,
            actor_source=RequestActivity.ActorSource.USER,
            metadata={"file_id": str(file_obj.id), "file_name": file_name},
        )
 
        return file_obj
    

    @staticmethod
    def generate_download_url(s3_key):

        if not s3_key:
            return None
        
        s3 = boto3.client(
            "s3",
            region_name = settings.AWS_S3_REGION_NAME,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

        return s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": s3_key,
            },
            ExpiresIn=300,
        )
 

