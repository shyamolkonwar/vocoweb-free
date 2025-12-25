"""
Waitlist API Routes with Supabase Integration
Secure endpoints with rate limiting and validation.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field, validator
import re
from typing import Optional

from app.services.supabase import supabase_service
from app.services.rate_limiter import rate_limiter

router = APIRouter()


class WaitlistEntry(BaseModel):
    """Waitlist entry request model."""
    contact: str = Field(..., min_length=5, max_length=100)
    contact_type: str = Field(..., pattern="^(email|whatsapp)$")
    business_description: Optional[str] = Field(None, max_length=500)
    language: str = Field(default="en", pattern="^(en|hi)$")
    
    @validator('contact')
    def validate_contact(cls, v, values):
        """Validate email or WhatsApp format."""
        contact_type = values.get('contact_type')
        
        if contact_type == 'email':
            # Basic email validation
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, v):
                raise ValueError('Invalid email format')
        elif contact_type == 'whatsapp':
            # WhatsApp number validation (digits only, 10-15 chars)
            phone_pattern = r'^\+?[0-9]{10,15}$'
            if not re.match(phone_pattern, v.replace(' ', '').replace('-', '')):
                raise ValueError('Invalid WhatsApp number format')
        
        return v.strip()


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/waitlist")
async def join_waitlist(entry: WaitlistEntry, request: Request):
    """
    Add user to waitlist with rate limiting and validation.
    
    Security measures:
    - Rate limiting: 5 requests per IP per hour
    - Input validation and sanitization
    - Duplicate detection
    - IP address logging for abuse prevention
    """
    # Get client IP for rate limiting
    client_ip = get_client_ip(request)
    
    # Check rate limit
    allowed, remaining = rate_limiter.is_allowed(client_ip)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )
    
    try:
        # Check if Supabase is configured
        if not supabase_service.is_configured():
            # Fallback to JSON file storage (existing implementation)
            raise HTTPException(
                status_code=503,
                detail="Waitlist service temporarily unavailable. Please try again later."
            )
        
        # Check for duplicates
        is_duplicate = await supabase_service.check_duplicate(entry.contact)
        if is_duplicate:
            raise HTTPException(
                status_code=400,
                detail="This contact is already on the waitlist"
            )
        
        # Add to waitlist
        user_agent = request.headers.get("User-Agent", "unknown")
        result = await supabase_service.add_waitlist_entry(
            contact=entry.contact,
            contact_type=entry.contact_type,
            business_description=entry.business_description,
            language=entry.language,
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        return {
            "message": "Successfully joined the waitlist!",
            "id": result.get("id"),
            "remaining_requests": remaining
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Waitlist error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to join waitlist. Please try again."
        )


@router.get("/waitlist/count")
async def get_waitlist_count():
    """
    Get total waitlist count (public endpoint).
    
    Note: Does not expose individual entries, only count.
    """
    try:
        if not supabase_service.is_configured():
            return {"count": 0, "message": "Waitlist service not configured"}
        
        count = await supabase_service.get_waitlist_count()
        return {"count": count}
        
    except Exception as e:
        print(f"Count error: {e}")
        return {"count": 0, "error": "Failed to fetch count"}
