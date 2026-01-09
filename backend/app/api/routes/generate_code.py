"""
Generate Code API Routes
Dual-Market AI-powered website generation using GPT-4o.

Pipelines:
- IN (India/Vyapar): Local business focus, WhatsApp CTAs, user photos
- GLOBAL (Authority): Solopreneur focus, booking CTAs, brand voice
"""

import os
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from openai import OpenAI

from app.core.config import get_settings
from app.core.auth_middleware import require_auth, AuthUser
from app.core.rate_limit import check_rate_limit
from app.ai.validator import validate_website, generate_repair_prompt

router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Prompts directory
PROMPTS_DIR = Path(__file__).parent.parent.parent.parent / "prompts"


class GenerateCodeRequest(BaseModel):
    """Request to generate website code directly."""
    user_prompt: str = Field(..., min_length=10, max_length=2000, description="User's description of the website they want")
    theme_colors: dict = Field(default_factory=lambda: {"primary": "#0d9488", "accent": "#f97316"}, description="Theme colors")
    market: str = Field(default="GLOBAL", pattern="^(GLOBAL|IN)$", description="Market segment")
    # India market fields
    user_images: Optional[List[str]] = Field(default=None, description="User-uploaded image URLs (up to 3)")
    whatsapp_number: Optional[str] = Field(default=None, description="WhatsApp number with country code")
    whatsapp_message: Optional[str] = Field(default=None, description="Pre-filled WhatsApp message")
    google_map_link: Optional[str] = Field(default=None, description="Google Maps embed link")
    # Global market fields
    brand_voice: Optional[str] = Field(default="Corporate & Clean", description="Brand voice: Bold, Empathetic, Corporate")
    booking_link: Optional[str] = Field(default=None, description="Calendly/Cal.com booking URL")
    email: Optional[str] = Field(default=None, description="Contact email")


class GenerateCodeResponse(BaseModel):
    """Response with generated HTML code."""
    html_code: str
    business_name: str
    business_type: str
    validation_result: Optional[dict] = None


def load_prompt(filename: str) -> str:
    """Load prompt content from file."""
    try:
        return (PROMPTS_DIR / filename).read_text()
    except FileNotFoundError:
        print(f"[Generate] Warning: Prompt file not found: {filename}")
        return ""


def load_branding_for_industry(business_type: str) -> str:
    """Extract relevant branding guidelines for the business type."""
    guidelines = load_prompt("branding_guidelines.txt")
    if not guidelines:
        return ""
    
    # Map business types to sections in the guidelines
    industry_map = {
        "dental": "HEALTHCARE",
        "medical": "HEALTHCARE",
        "clinic": "HEALTHCARE",
        "hospital": "HEALTHCARE",
        "pharmacy": "HEALTHCARE",
        "doctor": "HEALTHCARE",
        "restaurant": "FOOD & HOSPITALITY",
        "cafe": "FOOD & HOSPITALITY",
        "bakery": "FOOD & HOSPITALITY",
        "catering": "FOOD & HOSPITALITY",
        "food": "FOOD & HOSPITALITY",
        "tech": "TECH & SAAS",
        "software": "TECH & SAAS",
        "saas": "TECH & SAAS",
        "digital": "TECH & SAAS",
        "agency": "TECH & SAAS",
        "spa": "LUXURY & WELLNESS",
        "salon": "LUXURY & WELLNESS",
        "beauty": "LUXURY & WELLNESS",
        "boutique": "LUXURY & WELLNESS",
        "wellness": "LUXURY & WELLNESS",
        "tuition": "EDUCATION",
        "coaching": "EDUCATION",
        "school": "EDUCATION",
        "training": "EDUCATION",
        "education": "EDUCATION",
        "legal": "PROFESSIONAL SERVICES",
        "law": "PROFESSIONAL SERVICES",
        "accounting": "PROFESSIONAL SERVICES",
        "consulting": "PROFESSIONAL SERVICES",
        "shop": "RETAIL & E-COMMERCE",
        "store": "RETAIL & E-COMMERCE",
        "retail": "RETAIL & E-COMMERCE",
        "gym": "FITNESS & SPORTS",
        "fitness": "FITNESS & SPORTS",
        "yoga": "FITNESS & SPORTS",
        "sports": "FITNESS & SPORTS",
    }
    
    # Find matching industry
    business_lower = business_type.lower()
    matched_industry = "DEFAULT"
    for keyword, industry in industry_map.items():
        if keyword in business_lower:
            matched_industry = industry
            break
    
    # Extract the section from guidelines
    section_start = guidelines.find(f"================================================================================\n{matched_industry}")
    if section_start == -1:
        section_start = guidelines.find("================================================================================\nDEFAULT")
    
    if section_start != -1:
        section_end = guidelines.find("================================================================================", section_start + 80)
        if section_end != -1:
            return guidelines[section_start:section_end]
    
    return ""


def generate_website_code(
    user_prompt: str,
    theme_colors: dict,
    market: str,
    user_images: Optional[List[str]] = None,
    whatsapp_number: Optional[str] = None,
    whatsapp_message: Optional[str] = None,
    google_map_link: Optional[str] = None,
    brand_voice: Optional[str] = None,
    booking_link: Optional[str] = None,
    email: Optional[str] = None,
    business_type: Optional[str] = None
) -> tuple[str, dict]:
    """
    Generate complete HTML website code using AI with market-specific prompts.

    Args:
        user_prompt: User's description of desired website
        theme_colors: Dict with primary and accent colors
        market: Market segment (GLOBAL or IN)
        user_images: List of up to 3 user image URLs (India market)
        whatsapp_number: WhatsApp number (India market)
        whatsapp_message: Pre-filled WhatsApp message (India market)
        google_map_link: Google Maps embed link (India market)
        brand_voice: Brand voice style (Global market)
        booking_link: Calendly/Cal.com URL (Global market)
        email: Contact email (Global market)
        business_type: Type of business for branding guidelines

    Returns:
        Tuple of (HTML string, validation result dict)
    """
    # Load market-specific system prompt
    if market == "IN":
        system_prompt = load_prompt("india_system_prompt.txt")
    else:
        system_prompt = load_prompt("global_system_prompt.txt")
    
    # Load branding guidelines if business type is known
    branding_section = ""
    if business_type:
        branding_section = load_branding_for_industry(business_type)
        if branding_section:
            system_prompt += f"\n\n=== INDUSTRY-SPECIFIC BRANDING ===\n{branding_section}"
    
    # Build the user message with all context
    user_message = f"USER REQUEST:\n{user_prompt}\n\n"
    user_message += f"DESIGN SETTINGS:\n"
    user_message += f"- Primary Color: {theme_colors.get('primary', '#0d9488')}\n"
    user_message += f"- Accent Color: {theme_colors.get('accent', '#f97316')}\n"
    
    if market == "IN":
        # India market context
        if whatsapp_number:
            user_message += f"- WhatsApp Number: {whatsapp_number}\n"
            encoded_msg = (whatsapp_message or "Hi, I would like to inquire about your services").replace(" ", "%20")
            user_message += f"- WhatsApp Message (URL encoded): {encoded_msg}\n"
        if user_images:
            user_message += f"\nUSER IMAGES PROVIDED:\n"
            for i, img in enumerate(user_images[:3]):
                labels = ["Hero/Shop Front", "Owner/Team", "Product/Service"]
                user_message += f"- Image {i+1} ({labels[i] if i < len(labels) else 'Additional'}): {img}\n"
        if google_map_link:
            user_message += f"- Google Maps Link: {google_map_link}\n"
    else:
        # Global market context
        if brand_voice:
            user_message += f"- Brand Voice: {brand_voice}\n"
        if booking_link:
            user_message += f"- Booking Link: {booking_link}\n"
        if email:
            user_message += f"- Contact Email: {email}\n"
    
    user_message += "\n\nGenerate the complete HTML website now. Include ALL mandatory sections."
    
    # First generation attempt
    html_code = _call_ai_generation(system_prompt, user_message)
    
    # Validate the generated HTML
    validation = validate_website(html_code, market)
    
    # If validation fails, attempt repair
    if not validation["valid"] and validation["missing_sections"]:
        print(f"[Generate] Validation failed. Missing: {validation['missing_sections']}")
        
        # Generate repair prompt
        repair_prompt = generate_repair_prompt(validation["missing_sections"], market)
        repair_message = f"{user_message}\n\n{repair_prompt}"
        
        # Second attempt with repair instructions
        html_code = _call_ai_generation(system_prompt, repair_message)
        
        # Re-validate
        validation = validate_website(html_code, market)
        
        if not validation["valid"]:
            print(f"[Generate] Repair attempt still missing: {validation['missing_sections']}")
    
    return html_code, validation


def _call_ai_generation(system_prompt: str, user_message: str) -> str:
    """Call the AI model to generate HTML code."""
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=8000  # Increased for complete websites
        )

        html_code = response.choices[0].message.content

        # Clean up the response (remove any markdown formatting if present)
        if html_code.startswith("```html"):
            html_code = html_code[7:]
        if html_code.startswith("```"):
            html_code = html_code[3:]
        if html_code.endswith("```"):
            html_code = html_code[:-3]

        html_code = html_code.strip()
        
        # CRITICAL: Ensure Tailwind CDN is included (fallback injection)
        html_code = _ensure_tailwind_cdn(html_code)

        return html_code

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


def _ensure_tailwind_cdn(html: str) -> str:
    """
    Ensure Tailwind CSS CDN is included in the HTML.
    If missing, inject it into the <head> section.
    """
    tailwind_cdn = '<script src="https://cdn.tailwindcss.com"></script>'
    google_fonts = '''<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">'''
    
    # Check if Tailwind CDN is already present
    if "cdn.tailwindcss.com" in html:
        return html
    
    # If <head> exists, inject after it
    if "<head>" in html.lower():
        # Find the <head> tag (case insensitive)
        head_pos = html.lower().find("<head>")
        head_end = head_pos + 6  # Length of "<head>"
        
        injection = f'''
    <!-- Tailwind CSS CDN (Injected) -->
    {tailwind_cdn}
    <!-- Google Fonts -->
    {google_fonts}
    <style>
        body {{ font-family: 'Inter', sans-serif; }}
        h1, h2, h3, h4, h5, h6 {{ font-family: 'Playfair Display', serif; }}
    </style>
'''
        return html[:head_end] + injection + html[head_end:]
    
    # If no <head>, create proper HTML structure
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website</title>
    {tailwind_cdn}
    {google_fonts}
    <style>
        body {{ font-family: 'Inter', sans-serif; }}
        h1, h2, h3, h4, h5, h6 {{ font-family: 'Playfair Display', serif; }}
    </style>
</head>
<body>
{html}
</body>
</html>'''


@router.post("/generate-code", response_model=GenerateCodeResponse)
async def generate_code(
    request: GenerateCodeRequest,
    user: AuthUser = Depends(require_auth),
    x_market: str = Header(default="GLOBAL", alias="x-market")
):
    """
    Generate website HTML code directly using AI.

    This uses market-specific system prompts and includes validation.
    """
    settings = get_settings()

    # Check rate limit
    is_allowed, message, remaining = check_rate_limit(user.user_id, "generate")
    if not is_allowed:
        raise HTTPException(status_code=429, detail=message)

    # In production mode, check credits
    if settings.is_production:
        from app.services.supabase import supabase_service
        has_credits = await supabase_service.check_credits(user.user_id, "generate")
        if not has_credits:
            raise HTTPException(
                status_code=402,
                detail="Insufficient credits. Please purchase more credits."
            )

    try:
        # Determine market from header or request
        market = x_market.upper() if x_market else request.market
        
        # Extract business type from prompt for branding (simple extraction)
        business_type = None
        prompt_lower = request.user_prompt.lower()
        type_keywords = ["dental", "clinic", "restaurant", "bakery", "salon", "spa", "gym", 
                        "tuition", "coaching", "shop", "store", "agency", "consultant"]
        for kw in type_keywords:
            if kw in prompt_lower:
                business_type = kw.capitalize()
                break

        # Generate HTML code using AI with validation
        html_code, validation = generate_website_code(
            user_prompt=request.user_prompt,
            theme_colors=request.theme_colors,
            market=market,
            user_images=request.user_images,
            whatsapp_number=request.whatsapp_number,
            whatsapp_message=request.whatsapp_message,
            google_map_link=request.google_map_link,
            brand_voice=request.brand_voice,
            booking_link=request.booking_link,
            email=request.email,
            business_type=business_type
        )

        # Extract business info from the prompt (simple extraction)
        business_name = "Business Name"
        if "<title>" in html_code:
            title_start = html_code.find("<title>") + 7
            title_end = html_code.find("</title>")
            if title_end > title_start:
                title = html_code[title_start:title_end].strip()
                business_name = title.split(" | ")[0] if " | " in title else title

        return GenerateCodeResponse(
            html_code=html_code,
            business_name=business_name,
            business_type=business_type or "General Business",
            validation_result=validation
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Generate Code] Error: {e}")
        raise HTTPException(status_code=500, detail="Code generation failed. Please try again.")
