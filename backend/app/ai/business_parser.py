"""
Business Parser Module
Uses OpenAI to extract structured business information from unstructured text.
"""

import json
import os
from typing import Optional
from openai import OpenAI
from pydantic import BaseModel


class BusinessProfile(BaseModel):
    """Structured business profile extracted from description."""
    business_name: str
    business_type: str
    location: str
    services: list[str]
    tone: str
    cta: str
    tagline: str
    description: str


SYSTEM_PROMPT = """You are a business information extraction assistant for an AI website builder.
Your task is to extract structured information from a business description provided by a local business owner.

Extract the following information and return as JSON:
- business_name: A professional name for the business (infer from type and location if not provided)
- business_type: Category like "Dental Clinic", "Bakery", "Tuition Center", "Salon", "Hardware Store", etc.
- location: City/area where the business operates
- services: List of 3-6 key services/products offered
- tone: Either "Professional" or "Friendly" based on the business type
- cta: Call-to-action text like "Book Appointment", "Order Now", "Contact Us", "Enroll Now"
- tagline: A short catchy tagline for the business (max 10 words)
- description: A polished 2-3 sentence description for the website hero section

If information is not explicitly provided, make reasonable inferences based on the business type.
Always respond with valid JSON only, no markdown formatting."""


def parse_business_description(
    description: str, 
    language: str = "en",
    api_key: Optional[str] = None
) -> BusinessProfile:
    """
    Parse unstructured business description into structured profile using OpenAI.
    
    Args:
        description: Raw text description from user
        language: 'en' or 'hi' for output language preference
        api_key: OpenAI API key (uses env var if not provided)
    
    Returns:
        BusinessProfile with extracted information
    """
    # Get API key from environment if not provided
    if not api_key:
        api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        # Fallback to rule-based parsing if no API key
        return _fallback_parser(description, language)
    
    try:
        client = OpenAI(api_key=api_key)
        
        user_prompt = f"""Business description (language: {language}):
{description}

Extract the business information and return as JSON."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        # Parse the JSON response
        content = response.choices[0].message.content
        
        # Clean the response (remove markdown if present)
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        data = json.loads(content)
        return BusinessProfile(**data)
        
    except Exception as e:
        print(f"OpenAI parsing error: {e}")
        return _fallback_parser(description, language)


def _fallback_parser(description: str, language: str) -> BusinessProfile:
    """
    Rule-based fallback parser when OpenAI is unavailable.
    """
    desc = description.lower()
    
    # Detect business type
    business_type = "General Business"
    type_patterns = {
        "Dental Clinic": ["dental", "dentist", "teeth", "दांत", "डेंटल"],
        "Medical Clinic": ["clinic", "doctor", "medical", "क्लिनिक", "डॉक्टर"],
        "Bakery": ["bakery", "cake", "pastry", "bread", "बेकरी", "केक"],
        "Restaurant": ["restaurant", "food", "cafe", "रेस्टोरेंट", "खाना"],
        "Tuition Center": ["tuition", "coaching", "teach", "class", "ट्यूशन", "पढ़ा"],
        "Hardware Store": ["hardware", "tools", "paint", "plumbing", "हार्डवेयर"],
        "Salon": ["salon", "beauty", "hair", "spa", "सैलून", "ब्यूटी"],
        "Grocery Store": ["grocery", "kirana", "shop", "store", "किराना", "दुकान"]
    }

    for btype, patterns in type_patterns.items():
        if any(p in desc for p in patterns):
            business_type = btype
            break

    # Extract location
    import re
    location_match = re.search(
        r"(?:in|at|located in|में)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)",
        description,
        re.IGNORECASE
    )
    location = location_match.group(1) if location_match else "Your City"

    # Extract services
    services_match = re.search(
        r"(?:offer|provide|sell|specialize|करते|बेचते|मिलती)\s+(.+?)(?:\.|$)",
        description,
        re.IGNORECASE
    )
    services = []
    if services_match:
        services = [
            s.strip() for s in re.split(r",|and|और|एवं", services_match.group(1))
            if s.strip() and len(s.strip()) < 50
        ][:6]
    if not services:
        services = ["Professional Services", "Quality Products", "Expert Solutions"]

    # Generate business name
    business_name = f"{location} {business_type}".title()

    # CTA based on type
    cta_map = {
        "Dental Clinic": "Book Appointment",
        "Medical Clinic": "Book Appointment",
        "Bakery": "Order Now",
        "Restaurant": "View Menu",
        "Tuition Center": "Enroll Now",
        "Hardware Store": "Visit Store",
        "Salon": "Book Now",
        "Grocery Store": "Shop Now"
    }

    return BusinessProfile(
        business_name=business_name,
        business_type=business_type,
        location=location,
        services=services,
        tone="Friendly",
        cta=cta_map.get(business_type, "Contact Us"),
        tagline=f"Your Trusted {business_type} in {location}",
        description=description
    )
