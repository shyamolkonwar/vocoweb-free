"""
Layout Selector Module
Selects appropriate website layout based on business profile.
"""

from typing import List, Dict, Any
from pydantic import BaseModel


class LayoutBlueprint(BaseModel):
    """Blueprint for website layout."""
    sections: List[str]
    theme: str
    primary_color: str
    accent_color: str
    font_pair: str
    style: str


# Industry-specific layout configurations
INDUSTRY_LAYOUTS: Dict[str, Dict[str, Any]] = {
    "Dental Clinic": {
        "sections": ["hero", "services", "about_doctor", "testimonials", "map", "cta"],
        "theme": "light",
        "primary_color": "#0D9488",
        "accent_color": "#F97316",
        "font_pair": "modern",
        "style": "professional"
    },
    "Medical Clinic": {
        "sections": ["hero", "services", "doctors", "facilities", "contact", "cta"],
        "theme": "light",
        "primary_color": "#2563EB",
        "accent_color": "#10B981",
        "font_pair": "modern",
        "style": "professional"
    },
    "Bakery": {
        "sections": ["hero", "products", "about", "gallery", "contact", "cta"],
        "theme": "warm",
        "primary_color": "#D97706",
        "accent_color": "#EC4899",
        "font_pair": "playful",
        "style": "friendly"
    },
    "Restaurant": {
        "sections": ["hero", "menu", "about", "gallery", "reviews", "contact"],
        "theme": "dark",
        "primary_color": "#991B1B",
        "accent_color": "#F59E0B",
        "font_pair": "elegant",
        "style": "upscale"
    },
    "Tuition Center": {
        "sections": ["hero", "subjects", "faculty", "results", "testimonials", "enroll"],
        "theme": "light",
        "primary_color": "#7C3AED",
        "accent_color": "#F97316",
        "font_pair": "modern",
        "style": "academic"
    },
    "Hardware Store": {
        "sections": ["hero", "categories", "brands", "about", "contact", "cta"],
        "theme": "light",
        "primary_color": "#1D4ED8",
        "accent_color": "#F59E0B",
        "font_pair": "industrial",
        "style": "practical"
    },
    "Salon": {
        "sections": ["hero", "services", "gallery", "team", "booking", "contact"],
        "theme": "light",
        "primary_color": "#DB2777",
        "accent_color": "#8B5CF6",
        "font_pair": "elegant",
        "style": "glamorous"
    },
    "Grocery Store": {
        "sections": ["hero", "categories", "offers", "about", "delivery", "contact"],
        "theme": "light",
        "primary_color": "#059669",
        "accent_color": "#F97316",
        "font_pair": "friendly",
        "style": "practical"
    },
    "General Business": {
        "sections": ["hero", "services", "about", "contact", "cta"],
        "theme": "light",
        "primary_color": "#0D9488",
        "accent_color": "#F97316",
        "font_pair": "modern",
        "style": "professional"
    }
}


def select_layout(business_type: str, tone: str = "Friendly") -> LayoutBlueprint:
    """
    Select appropriate layout configuration for a business.
    
    Args:
        business_type: Type of business (e.g., "Dental Clinic")
        tone: Desired tone ("Professional" or "Friendly")
    
    Returns:
        LayoutBlueprint with selected configuration
    """
    # Get industry-specific layout or default
    config = INDUSTRY_LAYOUTS.get(business_type, INDUSTRY_LAYOUTS["General Business"])
    
    # Adjust based on tone
    if tone == "Professional":
        config = {**config, "font_pair": "modern", "style": "professional"}
    
    return LayoutBlueprint(**config)


def get_available_layouts() -> List[str]:
    """Get list of available industry layouts."""
    return list(INDUSTRY_LAYOUTS.keys())
