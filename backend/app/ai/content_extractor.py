"""
Content Extractor Module
Uses AI to extract structured business information from scraped website content.
"""

import json
from typing import Optional
from pydantic import BaseModel
from openai import OpenAI

from app.services.scraper import ScrapedContent


class ExtractedBusiness(BaseModel):
    """Business information extracted from scraped content."""
    business_name: str
    business_type: str
    location: str
    services: list[str]
    description: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_address: Optional[str] = None
    tagline: Optional[str] = None
    unique_points: list[str] = []


EXTRACTION_PROMPT = """You are a business information extraction assistant.
Given scraped content from a website, extract structured business information.

Extract the following and return as JSON:
- business_name: The name of the business
- business_type: Category like "Dental Clinic", "Restaurant", "Consulting Firm", etc.
- location: City/area where business operates (if mentioned)
- services: List of 3-6 key services or products offered
- description: A concise 2-3 sentence description of the business
- contact_phone: Phone number if found
- contact_email: Email if found
- contact_address: Physical address if found
- tagline: A short catchy tagline (create one if not present)
- unique_points: 2-3 unique selling points or differentiators

If information is not available, make reasonable inferences from context.
Always respond with valid JSON only, no markdown formatting."""


def extract_business_info(
    scraped: ScrapedContent,
    api_key: str
) -> ExtractedBusiness:
    """
    Extract structured business info from scraped content using AI.
    
    Args:
        scraped: ScrapedContent from scraper
        api_key: OpenAI API key
    
    Returns:
        ExtractedBusiness with structured information
    """
    client = OpenAI(api_key=api_key)
    
    # Prepare context from scraped content
    context = f"""
Website URL: {scraped.url}
Title: {scraped.title}
Description: {scraped.description}

Headings found:
{chr(10).join(f'- {h}' for h in scraped.headings[:10])}

Content excerpts:
{chr(10).join(scraped.paragraphs[:5])}

Detected services/products:
{chr(10).join(f'- {s}' for s in scraped.services[:10])}

Contact info found:
- Phone: {scraped.contact.get('phone', 'Not found')}
- Email: {scraped.contact.get('email', 'Not found')}
- Address: {scraped.contact.get('address', 'Not found')}

Additional text:
{scraped.raw_text[:2000]}
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": EXTRACTION_PROMPT},
                {"role": "user", "content": context}
            ],
            temperature=0.3,
            max_tokens=800
        )
        
        content = response.choices[0].message.content
        
        # Clean response
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        data = json.loads(content)
        
        # Merge with scraped contact info as fallback
        if not data.get("contact_phone") and scraped.contact.get("phone"):
            data["contact_phone"] = scraped.contact["phone"]
        if not data.get("contact_email") and scraped.contact.get("email"):
            data["contact_email"] = scraped.contact["email"]
        if not data.get("contact_address") and scraped.contact.get("address"):
            data["contact_address"] = scraped.contact["address"]
        
        return ExtractedBusiness(**data)
        
    except Exception as e:
        print(f"Extraction error: {e}")
        return _fallback_extraction(scraped)


def _fallback_extraction(scraped: ScrapedContent) -> ExtractedBusiness:
    """Fallback extraction without AI."""
    return ExtractedBusiness(
        business_name=scraped.title or "Business Website",
        business_type="General Business",
        location="",
        services=scraped.services[:6] or ["Professional Services"],
        description=scraped.description or scraped.paragraphs[0] if scraped.paragraphs else "A professional business.",
        contact_phone=scraped.contact.get("phone"),
        contact_email=scraped.contact.get("email"),
        contact_address=scraped.contact.get("address"),
        tagline=scraped.headings[0] if scraped.headings else None,
        unique_points=[]
    )


def create_business_profile_from_extraction(
    extracted: ExtractedBusiness,
    tone: str = "Professional",
    cta: str = "Contact Us"
):
    """
    Convert ExtractedBusiness to BusinessProfile for website generation.
    """
    from app.ai.business_parser import BusinessProfile
    
    # Determine CTA based on business type
    cta_map = {
        "dental": "Book Appointment",
        "clinic": "Book Appointment",
        "hospital": "Book Appointment",
        "restaurant": "View Menu",
        "cafe": "Order Now",
        "bakery": "Order Now",
        "tuition": "Enroll Now",
        "coaching": "Enroll Now",
        "salon": "Book Now",
        "spa": "Book Now",
        "gym": "Join Now",
        "fitness": "Start Today",
        "shop": "Shop Now",
        "store": "Shop Now",
    }
    
    btype_lower = extracted.business_type.lower()
    for key, value in cta_map.items():
        if key in btype_lower:
            cta = value
            break
    
    return BusinessProfile(
        business_name=extracted.business_name,
        business_type=extracted.business_type,
        location=extracted.location or "Your City",
        services=extracted.services,
        tone=tone,
        cta=cta,
        tagline=extracted.tagline or f"Your Trusted {extracted.business_type}",
        description=extracted.description
    )
