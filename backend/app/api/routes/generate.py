"""
Generate API Routes
Orchestrates the text-to-website generation pipeline.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field

from app.ai import parse_business_description, select_layout
from app.website import build_website
from app.core.config import get_settings
from app.core.rate_limit import check_rate_limit, upstash_rate_limiter
from app.core.auth_middleware import require_auth, AuthUser

router = APIRouter()

# Data storage
DATA_DIR = Path(__file__).parent.parent.parent / "data"
WEBSITES_FILE = DATA_DIR / "websites.json"


class VoiceProfile(BaseModel):
    """Voice/style profile for content generation."""
    tone_label: str = Field(default="Professional")
    keywords: list[str] = Field(default_factory=list)
    sentence_style: str = Field(default="Balanced")
    vocabulary_level: str = Field(default="Moderate")
    perspective: str = Field(default="First person (We/I)")
    emoji_policy: str = Field(default="None")
    rules: list[str] = Field(default_factory=list)
    forbidden_words: list[str] = Field(default_factory=list)
    sample_snippet: str = Field(default="")


class GenerateRequest(BaseModel):
    """Request to generate a website."""
    description: str = Field(..., min_length=20, max_length=2000)
    language: str = Field(default="en", pattern="^(en|hi)$")
    # Voice/Style profile (optional)
    style_guide: str | None = Field(default=None, description="Pre-built style guide prompt")
    voice_profile: VoiceProfile | None = Field(default=None, description="Structured voice profile")
    # WhatsApp settings (India market)
    whatsapp_number: str | None = Field(default=None, description="Cleaned WhatsApp number with country code")
    whatsapp_message: str | None = Field(default=None, description="Pre-filled booking message")
    whatsapp_enabled: bool = Field(default=False, description="Enable WhatsApp booking button")
    # User-uploaded images (India market - upfront upload)
    user_images: list[str] | None = Field(default=None, description="User-uploaded image URLs for Hero/About/Services (up to 3)")
    google_map_link: str | None = Field(default=None, description="Google Maps embed link (India market)")
    # Color theme
    theme_id: str | None = Field(default=None, description="Color theme ID: trust, warmth, growth, modern, luxury")
    # Global market fields (NEW)
    brand_voice: str | None = Field(default=None, description="Brand voice: Bold & Confident, Empathetic & Soft, Corporate & Clean")
    booking_link: str | None = Field(default=None, description="Calendly/Cal.com booking URL (Global market)")
    email: str | None = Field(default=None, description="Contact email (Global market)")


class GenerateResponse(BaseModel):
    """Response after website generation."""
    id: str
    business_name: str
    business_type: str
    location: str


def ensure_data_dir():
    """Ensure data directory exists."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not WEBSITES_FILE.exists():
        WEBSITES_FILE.write_text("{}")


def load_websites() -> dict:
    """Load websites from storage."""
    ensure_data_dir()
    try:
        return json.loads(WEBSITES_FILE.read_text())
    except json.JSONDecodeError:
        return {}


def save_website(website_data: dict):
    """
    Save website to storage with file locking.
    SECURITY: VULN-H04 fix - Atomic file operations to prevent race conditions.
    """
    import fcntl
    ensure_data_dir()
    
    # Create file if doesn't exist
    if not WEBSITES_FILE.exists():
        WEBSITES_FILE.write_text("{}")
    
    with open(WEBSITES_FILE, 'r+') as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            websites = json.load(f)
            websites[website_data["id"]] = website_data
            f.seek(0)
            f.truncate()
            json.dump(websites, f, indent=2)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)


def get_website_with_ownership(website_id: str, owner_id: str) -> dict | None:
    """
    Get website from local storage with ownership check.
    SECURITY: VULN-H02 fix - Verify ownership even in dev mode.
    """
    websites = load_websites()
    website = websites.get(website_id)
    if website:
        # Check ownership - support both 'owner_id' and legacy data without it
        stored_owner = website.get("owner_id")
        if stored_owner is None or stored_owner == owner_id:
            return website
    return None


@router.post("/generate", response_model=GenerateResponse)
async def generate_website(
    request: GenerateRequest,
    user: AuthUser = Depends(require_auth),
    x_market: str = Header(default="GLOBAL", alias="x-market")  # Market header
):
    """
    Generate a website from text description (synchronous).
    
    Pipeline:
    1. Parse business description (OpenAI)
    2. Select layout (rules engine)
    3. Build HTML (template engine)
    4. Store to Supabase (production) or local JSON (dev)
    
    Market-aware:
    - x-market: IN → Simpler hero, WhatsApp forced on, high-contrast theme
    - x-market: GLOBAL → Brand voice enabled, modern-glass theme
    """
    from app.services.supabase import supabase_service
    
    settings = get_settings()
    
    # Normalize market to uppercase
    market = x_market.upper() if x_market else "GLOBAL"
    is_india_market = market == "IN"
    
    # Check rate limit
    is_allowed, message, remaining = check_rate_limit(user.user_id, "generate")
    if not is_allowed:
        upstash_rate_limiter.track_abuse_signal(user.user_id, "limit_violations")
        raise HTTPException(status_code=429, detail=message)
    
    # In production mode, check and deduct credits
    if settings.is_production:
        has_credits = await supabase_service.check_credits(user.user_id, "generate")
        if not has_credits:
            raise HTTPException(
                status_code=402,
                detail="Insufficient credits. Please purchase more credits."
            )
    
    try:
        # Step 1: Parse business description (with optional style guide)
        business = parse_business_description(
            request.description,
            request.language,
            settings.openai_api_key,
            style_guide=request.style_guide
        )
        
        # Step 2: Determine image availability
        has_user_images = bool(request.user_images and len(request.user_images) > 0)
        user_image_count = len(request.user_images) if request.user_images else 0
        
        # Step 3: Build user images dict
        user_images_dict = None
        if has_user_images:
            user_images_dict = {}
            if len(request.user_images) > 0:
                user_images_dict["hero"] = request.user_images[0]
            if len(request.user_images) > 1:
                user_images_dict["about"] = request.user_images[1]
        
        # Market-specific WhatsApp override
        if is_india_market and request.whatsapp_number:
            request.whatsapp_enabled = True
        
        # Step 4: Generate HTML using direct AI generation with dual-market support
        html = await build_website(
            business=business,
            language=request.language,
            images=user_images_dict,
            theme_colors={"primary": "#0d9488", "accent": "#f97316"},
            whatsapp_phone=request.whatsapp_number if request.whatsapp_enabled else None,
            whatsapp_message=request.whatsapp_message,
            # New dual-market parameters
            user_images=request.user_images,
            google_map_link=request.google_map_link,
            brand_voice=request.brand_voice,
            booking_link=request.booking_link,
            email=request.email
        )
        
        # Step 6: Store website
        # SECURITY: Use UUID4 for cryptographically secure, unpredictable IDs
        import uuid
        website_id = f"site_{uuid.uuid4().hex}"
        
        # In production mode, save to Supabase
        if settings.is_production:
            try:
                print(f"[Architect] Saving website to Supabase for user {user.user_id}")
                website_record = await supabase_service.create_website(
                    owner_id=user.user_id,
                    data={
                        "status": "draft",
                        "business_json": business.model_dump(),
                        "layout_json": {
                            "direct_ai_mode": True
                        },
                        "html": html,
                        "description": request.description,
                        "language": request.language,
                        "source_type": "text",
                        # Voice profile
                        "voice_profile": request.voice_profile.model_dump() if request.voice_profile else None,
                        # WhatsApp settings
                        "whatsapp_number": request.whatsapp_number,
                        "whatsapp_message": request.whatsapp_message,
                        "whatsapp_enabled": request.whatsapp_enabled
                    }
                )
                website_id = website_record["id"]
                print(f"[Architect] Website saved to Supabase: {website_id}")
                
                # Deduct credits after successful generation
                await supabase_service.deduct_credits(
                    user.user_id, 
                    "generate", 
                    f"[Architect] Generated: {business.business_name}"
                )
                
                # Track usage
                await supabase_service.increment_usage_limit(user.user_id, "generate")
            except Exception as e:
                print(f"[Architect] ERROR saving to Supabase: {e}")
                # Fallback to local storage
                website_data = {
                    "id": website_id,
                    "description": request.description,
                    "language": request.language,
                    "business": business.model_dump(),
                    "layout_json": {"direct_ai_mode": True},
                    "html": html,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                save_website(website_data)
        else:
            # Development mode: save to local JSON
            website_data = {
                "id": website_id,
                "description": request.description,
                "language": request.language,
                "business": business.model_dump(),
                "layout_json": {"direct_ai_mode": True},
                "html": html,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            save_website(website_data)
        
        return GenerateResponse(
            id=website_id,
            business_name=business.business_name,
            business_type=business.business_type,
            location=business.location
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # SECURITY: Log details internally, return generic error
        print(f"[Generate] Error: {e}")
        raise HTTPException(status_code=500, detail="Generation failed. Please try again.")


class AsyncGenerateResponse(BaseModel):
    """Response for async website generation."""
    task_id: str
    message: str


@router.post("/generate/async", response_model=AsyncGenerateResponse)
async def generate_website_async(
    request: GenerateRequest,
    user: AuthUser = Depends(require_auth)
):
    """
    Generate a website asynchronously.
    
    Returns immediately with a task_id.
    Poll /api/tasks/{task_id} to check status.
    """
    from app.workers.tasks import generate_website_task
    from app.services.supabase import supabase_service
    
    settings = get_settings()
    
    # Check rate limit before enqueueing task
    is_allowed, message, remaining = check_rate_limit(user.user_id, "generate")
    if not is_allowed:
        # Track abuse signal
        upstash_rate_limiter.track_abuse_signal(user.user_id, "limit_violations")
        raise HTTPException(
            status_code=429,
            detail=message
        )
    
    # Check if user is blocked due to abuse
    if upstash_rate_limiter.is_user_blocked(user.user_id):
        raise HTTPException(
            status_code=429,
            detail="Too many violations. Please try again later."
        )
    
    # In production mode, check and deduct credits
    if settings.is_production:
        has_credits = await supabase_service.check_credits(user.user_id, "generate")
        if not has_credits:
            raise HTTPException(
                status_code=402,
                detail="Insufficient credits. Please purchase more credits."
            )
        
        # Deduct credits
        await supabase_service.deduct_credits(
            user.user_id, 
            "generate", 
            f"Website generation: {request.description[:50]}..."
        )
    
    # Queue the task (with user_id for Supabase storage in production)
    task = generate_website_task.delay(
        description=request.description,
        language=request.language,
        user_id=user.user_id if settings.is_production else None
    )
    
    return AsyncGenerateResponse(
        task_id=task.id,
        message=f"Website generation started. {remaining} generations remaining this hour."
    )


@router.get("/preview/{website_id}")
async def get_preview(
    website_id: str,
    user: AuthUser = Depends(require_auth)  # SECURITY: Require auth
):
    """Get website preview by ID (authenticated)."""
    from app.services.supabase import supabase_service
    import uuid as uuid_module
    
    # Check if it's a UUID (Supabase website) or site_* (local)
    is_uuid = False
    try:
        uuid_module.UUID(str(website_id))
        is_uuid = True
    except (ValueError, TypeError):
        is_uuid = False
    
    # For UUID websites, check Supabase first
    if is_uuid:
        settings = get_settings()
        if settings.is_production:
            # SECURITY: VULN-H01 fix - Verify ownership
            website = await supabase_service.get_website(website_id, owner_id=user.id)
            if website:
                return {
                    "id": website_id,
                    "html": website.get("html", ""),
                    "business": website.get("business_json", {})
                }
    
    # Fallback to local JSON storage
    # SECURITY: VULN-H02 fix - Verify ownership in dev mode too
    website = get_website_with_ownership(website_id, user.id)
    
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    
    return {
        "id": website_id,
        "html": website.get("html", ""),
        "business": website.get("business", {})
    }


@router.post("/regenerate/{website_id}")
async def regenerate_website(
    website_id: str,
    user: AuthUser = Depends(require_auth)  # SECURITY: Require auth
):
    """Regenerate website with new styling."""
    settings = get_settings()
    websites = load_websites()
    
    if website_id not in websites:
        raise HTTPException(status_code=404, detail="Website not found")
    
    website = websites[website_id]
    
    try:
        # Re-parse with OpenAI for potentially different tagline
        business = parse_business_description(
            website["description"],
            website["language"],
            settings.openai_api_key
        )
        
        # Get layout with slight random variation
        layout = select_layout(business.business_type, business.tone)
        
        # Rebuild HTML
        html = build_website(business, layout, website["language"])
        
        # Update storage
        website["business"] = business.model_dump()
        website["layout"] = layout.model_dump()
        website["html"] = html
        website["updated_at"] = datetime.now().isoformat()
        
        save_website(website)
        
        return {
            "id": website_id,
            "html": html,
            "business": business.model_dump()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regeneration failed: {str(e)}")
