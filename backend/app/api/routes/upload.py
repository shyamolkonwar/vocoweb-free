"""
Upload API Routes
Handles presigned URL generation for direct-to-R2 image uploads.
"""

import uuid
from datetime import datetime
from typing import Literal
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.auth_middleware import require_auth, AuthUser

router = APIRouter()


class PresignRequest(BaseModel):
    """Request for a presigned upload URL."""
    filename: str = Field(..., min_length=1, max_length=255)
    content_type: Literal["image/jpeg", "image/png", "image/webp", "image/gif"] = Field(...)
    website_id: str = Field(..., description="Website this image belongs to")


class PresignResponse(BaseModel):
    """Response with presigned upload URL."""
    upload_url: str
    public_url: str
    key: str
    expires_in: int = 60


@router.post("/upload/presign", response_model=PresignResponse)
async def get_presigned_url(
    request: PresignRequest,
    user: AuthUser = Depends(require_auth)
):
    """
    Generate a presigned URL for direct upload to Cloudflare R2.
    
    The client uses this URL to upload the file directly to R2,
    bypassing the backend server for better performance.
    
    Flow:
    1. Client requests presigned URL with filename and content_type
    2. Backend validates user and generates secure upload URL
    3. Client uploads directly to R2 using the presigned URL
    4. Client uses the returned public_url in their website
    """
    settings = get_settings()
    
    # Check R2 configuration
    if not all([
        settings.cloudflare_r2_access_key,
        settings.cloudflare_r2_secret_key,
        settings.cloudflare_r2_bucket,
        settings.cloudflare_r2_endpoint
    ]):
        raise HTTPException(
            status_code=503, 
            detail="Image upload not configured. Please set R2 credentials."
        )
    
    try:
        import boto3
        from botocore.config import Config
        
        # Extract file extension
        original_ext = request.filename.rsplit('.', 1)[-1].lower()
        if original_ext not in ['jpg', 'jpeg', 'png', 'webp', 'gif']:
            original_ext = 'jpg'  # Default
        
        # Generate unique key: uploads/{user_id}/{website_id}/{timestamp}_{uuid}.{ext}
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        key = f"uploads/{user.id}/{request.website_id}/{timestamp}_{unique_id}.{original_ext}"
        
        # Create S3 client for R2
        s3_client = boto3.client(
            's3',
            endpoint_url=settings.cloudflare_r2_endpoint,
            aws_access_key_id=settings.cloudflare_r2_access_key,
            aws_secret_access_key=settings.cloudflare_r2_secret_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
        
        # Generate presigned PUT URL
        # SECURITY: 300 seconds (5 min) allows for slow connections while limiting exposure
        upload_url = s3_client.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': settings.cloudflare_r2_bucket,
                'Key': key,
                'ContentType': request.content_type,
            },
            ExpiresIn=300  # URL valid for 5 minutes
        )
        
        # Construct public URL
        # Format: https://assets.vocoweb.in/{key}
        # Or if using R2.dev: https://{bucket}.{account}.r2.dev/{key}
        public_url = f"https://assets.vocoweb.in/{key}"
        
        return PresignResponse(
            upload_url=upload_url,
            public_url=public_url,
            key=key,
            expires_in=300
        )
        
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="boto3 not installed. Run: pip install boto3"
        )
    except Exception as e:
        print(f"Presign error: {e}")  # SECURITY: Log internally
        raise HTTPException(
            status_code=500,
            detail="Failed to generate upload URL. Please try again."
        )


@router.delete("/upload/{key:path}")
async def delete_upload(
    key: str,
    user: AuthUser = Depends(require_auth)
):
    """
    Delete an uploaded file from R2.
    Only allows deletion of files owned by the authenticated user.
    """
    settings = get_settings()
    
    # Security: Ensure user can only delete their own files
    if not key.startswith(f"uploads/{user.id}/"):
        raise HTTPException(status_code=403, detail="Cannot delete files you don't own")
    
    try:
        import boto3
        from botocore.config import Config
        
        s3_client = boto3.client(
            's3',
            endpoint_url=settings.cloudflare_r2_endpoint,
            aws_access_key_id=settings.cloudflare_r2_access_key,
            aws_secret_access_key=settings.cloudflare_r2_secret_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
        
        s3_client.delete_object(
            Bucket=settings.cloudflare_r2_bucket,
            Key=key
        )
        
        return {"success": True, "deleted": key}
        
    except Exception as e:
        print(f"Delete error: {e}")  # SECURITY: Log internally
        raise HTTPException(
            status_code=500,
            detail="Failed to delete file. Please try again."
        )
