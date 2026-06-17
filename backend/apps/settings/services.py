import uuid
import boto3
from botocore.exceptions import ClientError
from django.conf import settings

from apps.common.logger import logger
from .repositories import UserSettingsRepository


#custom Exceptions
class WrongCurrentPassword(Exception):
    pass


class SlugAlreadyTaken(Exception):
    pass

class InvalidFileType(Exception):
    pass

class FileTooLarge(Exception):
    pass

class S3UploadError(Exception):
    pass


# S3 Helper

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/svg+xml"}
MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB

def _validate_image(file):
    """Shared validation for logo and avatar uploads."""
    content_type = getattr(file, "content_type", "") or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise InvalidFileType(
            "Unsupported file type. Please upload a JPG, PNG, WebP, or SVG."
        )
    if file.size > MAX_FILE_SIZE_BYTES:
        raise FileTooLarge("File must be 2 MB or smaller.")
    

def _upload_to_s3(file, folder: str) -> str:
    """
    Upload a file-like object to S3.
    Returns the public URL.
    Folder: 'logos' | 'avatars'
    """
    ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else "jpg"
    key = f"{folder}/{uuid.uuid4()}.{ext}"
 
    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
    )
 
    try:
        s3.upload_fileobj(
            file,
            settings.AWS_STORAGE_BUCKET_NAME,
            key,
            ExtraArgs={"ContentType": file.content_type},
        )
    except ClientError as e:
        logger.error("s3_upload_failed folder=%s error=%s", folder, str(e))
        raise S3UploadError("File upload failed. Please try again.")
 
    url = (
        f"https://{settings.AWS_STORAGE_BUCKET_NAME}"
        f".s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{key}"
    )
    logger.info("s3_upload_success folder=%s key=%s", folder, key)
    return url
 

 # Profile Service

class ProfileService:
    
    @staticmethod
    def get_profile(user):
        return {
            "display_name": user.display_name,
            "email": user.email,
            "avatar_url": user.avatar_url,
        }
    
    @staticmethod
    def update_display_name(user, display_name):
        user = UserSettingsRepository.update_display_name(user, display_name)
        logger.info("profile_display_name_updated user_id=%s", user.id)
        return user
    
    @staticmethod
    def change_password(user, current_password, new_password):
        if not user.check_password(current_password):
            raise WrongCurrentPassword("current password is incorrect")
        UserSettingsRepository.update_password(user, new_password)
        logger.info("profile_password_changed user_id=%s", user.id)


    @staticmethod
    def upload_avatar(user, file):
        _validate_image(file)
        url = _upload_to_s3(file, folder="avatars")
        UserSettingsRepository.update_avatar(user, url)
        logger.info("profile_avatar_uploaded user_id=%s", user.id)
        return url
    
    


