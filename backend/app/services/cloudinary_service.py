# backend/app/services/cloudinary_service.py
import logging
import os
import cloudinary
import cloudinary.uploader
from app.config import settings

logger = logging.getLogger("hospital_ops.cloudinary_service")

# Configure Cloudinary if keys are valid
is_configured = False
if (settings.cloudinary_cloud_name and "your_" not in settings.cloudinary_cloud_name and
    settings.cloudinary_api_key and "your_" not in settings.cloudinary_api_key and
    settings.cloudinary_api_secret and "your_" not in settings.cloudinary_api_secret):
    try:
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True
        )
        is_configured = True
        logger.info("Cloudinary service configured successfully.")
    except Exception as e:
        logger.error(f"Failed to configure Cloudinary: {e}")
else:
    logger.warning("Cloudinary credentials are unset or placeholders. Falling back to local storage.")

def upload_pdf_report(file_bytes: bytes, filename: str) -> str:
    """
    Uploads a PDF file to Cloudinary and returns its secure URL.
    Falls back to a local storage server URL if Cloudinary is not configured.
    """
    if is_configured:
        try:
            logger.info(f"Uploading {filename} to Cloudinary...")
            result = cloudinary.uploader.upload(
                file_bytes,
                resource_type="raw",
                folder="hospital_reports",
                public_id=filename.replace(".pdf", ""),
                overwrite=True
            )
            secure_url = result.get("secure_url")
            logger.info(f"Cloudinary upload successful: {secure_url}")
            return secure_url
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}. Falling back to local storage.")
    
    # Local fallback
    os.makedirs("./uploads", exist_ok=True)
    local_path = os.path.join("./uploads", filename)
    try:
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        local_url = f"http://localhost:8000/static/{filename}"
        logger.info(f"Local fallback upload successful: {local_url}")
        return local_url
    except Exception as e:
        logger.error(f"Failed to write file to local disk: {e}")
        raise RuntimeError("Failed to save report file.")
