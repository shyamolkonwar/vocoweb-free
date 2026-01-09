"""
Leads API Routes
Lead capture and management for generated websites.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field

from app.services import supabase_service
from app.core.auth_middleware import require_auth, AuthUser

router = APIRouter()


# ============================================
# Request/Response Models
# ============================================

class LeadSubmitRequest(BaseModel):
    """Public lead submission from generated websites."""
    website_id: str = Field(..., description="Website UUID")
    customer_name: str = Field(..., min_length=1, max_length=200)
    customer_phone: Optional[str] = Field(None, max_length=20)
    customer_email: Optional[str] = Field(None, max_length=255)
    message: Optional[str] = Field(None, max_length=1000)
    service_interested: Optional[str] = Field(None, max_length=200)
    source_page: Optional[str] = Field("contact", max_length=50)


class LeadResponse(BaseModel):
    """Lead data response."""
    id: str
    website_id: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    message: Optional[str] = None
    service_interested: Optional[str] = None
    source_page: str = "contact"
    status: str = "new"
    created_at: str
    updated_at: Optional[str] = None
    # Joined website info
    website_name: Optional[str] = None
    website_subdomain: Optional[str] = None


class LeadsListResponse(BaseModel):
    """List of leads response."""
    leads: List[LeadResponse]
    total: int
    stats: Optional[dict] = None


class LeadUpdateRequest(BaseModel):
    """Update lead status."""
    status: str = Field(..., pattern="^(new|contacted|converted)$")


# ============================================
# PUBLIC ENDPOINT: Lead Submit
# ============================================

@router.post("/leads/submit")
async def submit_lead(lead: LeadSubmitRequest, request: Request):
    """
    Public endpoint for lead form submissions from generated websites.
    
    Rate limited to prevent abuse.
    """
    # SECURITY: VULN-M01 fix - IP-based rate limiting for public endpoint
    from app.core.rate_limit import check_ip_rate_limit
    
    client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if not client_ip and request.client:
        client_ip = request.client.host
    
    is_allowed, msg, _ = check_ip_rate_limit(client_ip, "lead_submit")
    if not is_allowed:
        raise HTTPException(status_code=429, detail=msg)
    
    # Validate website exists
    website = await supabase_service.get_website_public(lead.website_id)
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    
    # Check if website is live (only accept leads from published sites)
    if website.get("status") != "live":
        raise HTTPException(
            status_code=400, 
            detail="Website is not published. Cannot accept leads."
        )
    
    # SECURITY: Sanitize metadata to prevent injection
    import re
    
    def sanitize_header(value: str) -> str:
        """Remove potentially dangerous chars from header values."""
        if not value:
            return ""
        # Only allow alphanumeric, spaces, and basic punctuation
        return re.sub(r'[^\w\s\.\-\/\:\;\,\(\)]', '', str(value)[:500])
    
    # Store lead in Supabase
    lead_data = {
        "website_id": lead.website_id,
        "customer_name": lead.customer_name[:200] if lead.customer_name else "",
        "customer_phone": re.sub(r'[^\d\+\-\s]', '', lead.customer_phone or "")[:20],
        "customer_email": lead.customer_email[:200] if lead.customer_email else "",
        "message": lead.message[:2000] if lead.message else "",
        "service_interested": lead.service_interested[:200] if lead.service_interested else "",
        "source_page": lead.source_page[:100] if lead.source_page else "contact",
        "metadata": {
            "user_agent": sanitize_header(request.headers.get("user-agent", ""))[:300],
            "origin": sanitize_header(request.headers.get("origin", ""))[:200],
            "submitted_at": datetime.utcnow().isoformat()
        }
    }
    
    result = await supabase_service.create_lead(lead_data)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to save lead")
    
    return {
        "success": True,
        "message": "Thank you! We'll contact you soon.",
        "lead_id": result.get("id")
    }


# ============================================
# PROTECTED ENDPOINTS: Lead Management
# ============================================

@router.get("/dashboard/leads", response_model=LeadsListResponse)
async def get_dashboard_leads(
    status: Optional[str] = None,
    website_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user: AuthUser = Depends(require_auth)
):
    """
    Get leads for all websites owned by the authenticated user.
    
    Optionally filter by status or specific website.
    """
    leads_data = await supabase_service.get_user_leads(
        owner_id=user.id,
        status=status,
        website_id=website_id,
        limit=limit,
        offset=offset
    )
    
    # Get stats
    stats = await supabase_service.get_lead_stats(user.id)
    
    return LeadsListResponse(
        leads=[
            LeadResponse(
                id=str(lead.get("id")),
                website_id=str(lead.get("website_id")),
                customer_name=lead.get("customer_name", ""),
                customer_phone=lead.get("customer_phone"),
                customer_email=lead.get("customer_email"),
                message=lead.get("message"),
                service_interested=lead.get("service_interested"),
                source_page=lead.get("source_page", "contact"),
                status=lead.get("status", "new"),
                created_at=lead.get("created_at"),
                updated_at=lead.get("updated_at"),
                website_name=lead.get("websites", {}).get("business_json", {}).get("business_name") if lead.get("websites") else None,
                website_subdomain=lead.get("websites", {}).get("subdomain") if lead.get("websites") else None
            )
            for lead in leads_data
        ],
        total=len(leads_data),
        stats=stats
    )


@router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str, user: AuthUser = Depends(require_auth)):
    """Get a specific lead by ID (must be owned by user's website)."""
    lead = await supabase_service.get_lead(lead_id, user.id)
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return LeadResponse(
        id=str(lead.get("id")),
        website_id=str(lead.get("website_id")),
        customer_name=lead.get("customer_name", ""),
        customer_phone=lead.get("customer_phone"),
        customer_email=lead.get("customer_email"),
        message=lead.get("message"),
        service_interested=lead.get("service_interested"),
        source_page=lead.get("source_page", "contact"),
        status=lead.get("status", "new"),
        created_at=lead.get("created_at"),
        updated_at=lead.get("updated_at")
    )


@router.patch("/leads/{lead_id}/status")
async def update_lead_status(
    lead_id: str,
    update: LeadUpdateRequest,
    user: AuthUser = Depends(require_auth)
):
    """Update the status of a lead (new -> contacted -> converted)."""
    success = await supabase_service.update_lead_status(
        lead_id=lead_id,
        owner_id=user.id,
        status=update.status
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Lead not found or not owned by you")
    
    return {
        "success": True,
        "message": f"Lead status updated to '{update.status}'",
        "lead_id": lead_id
    }


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user: AuthUser = Depends(require_auth)):
    """Delete a lead (must be owned by user's website)."""
    success = await supabase_service.delete_lead(lead_id, user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"success": True, "message": "Lead deleted"}


# ============================================
# POPUP SETTINGS
# ============================================

class PopupSettingsResponse(BaseModel):
    """Popup settings for a website."""
    website_id: str
    enabled: bool = True
    headline: str = "Get a Free Quote!"
    subheadline: str = "Fill in your details and we'll get back to you."
    offer_text: Optional[str] = None
    trigger_type: str = "time"
    trigger_delay_seconds: int = 5
    trigger_scroll_percent: int = 50


class PopupSettingsUpdate(BaseModel):
    """Update popup settings."""
    enabled: Optional[bool] = None
    headline: Optional[str] = None
    subheadline: Optional[str] = None
    offer_text: Optional[str] = None
    trigger_type: Optional[str] = None
    trigger_delay_seconds: Optional[int] = None
    trigger_scroll_percent: Optional[int] = None


@router.get("/websites/{website_id}/popup", response_model=PopupSettingsResponse)
async def get_popup_settings(
    website_id: str,
    user: AuthUser = Depends(require_auth)
):
    """Get popup settings for a website."""
    # Verify ownership
    website = await supabase_service.get_website(website_id, user.id)
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    
    popup_settings = await supabase_service.get_popup_settings(website_id)
    
    if not popup_settings:
        # Return defaults
        return PopupSettingsResponse(website_id=website_id)
    
    return PopupSettingsResponse(
        website_id=website_id,
        enabled=popup_settings.get("enabled", True),
        headline=popup_settings.get("headline", "Get a Free Quote!"),
        subheadline=popup_settings.get("subheadline", "Fill in your details and we'll get back to you."),
        offer_text=popup_settings.get("offer_text"),
        trigger_type=popup_settings.get("trigger_type", "time"),
        trigger_delay_seconds=popup_settings.get("trigger_delay_seconds", 5),
        trigger_scroll_percent=popup_settings.get("trigger_scroll_percent", 50)
    )


@router.put("/websites/{website_id}/popup", response_model=PopupSettingsResponse)
async def update_popup_settings(
    website_id: str,
    update: PopupSettingsUpdate,
    user: AuthUser = Depends(require_auth)
):
    """Update popup settings and trigger re-deployment."""
    # Verify ownership
    website = await supabase_service.get_website(website_id, user.id)
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    
    # Update or create settings
    popup_settings = await supabase_service.upsert_popup_settings(
        website_id=website_id,
        updates=update.dict(exclude_none=True)
    )
    
    # TODO: Trigger re-deployment with new popup settings
    # This will regenerate the HTML with updated popup config
    
    return PopupSettingsResponse(
        website_id=website_id,
        **popup_settings
    )
