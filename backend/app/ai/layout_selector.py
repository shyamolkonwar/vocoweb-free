"""
Layout Selector Module
Selects appropriate website layout and component variants based on business profile.
"""

from typing import List, Dict, Any
from pydantic import BaseModel


class LayoutBlueprint(BaseModel):
    """Blueprint for website layout with component variants."""
    # Component template selections
    hero_variant: str
    services_variant: str
    about_variant: str
    contact_variant: str
    footer_variant: str
    
    # Styling
    primary_color: str
    accent_color: str
    font_heading: str
    font_body: str
    theme: str  # 'light', 'dark', 'warm'
    style: str  # 'professional', 'friendly', 'luxury', 'trendy'
    
    # Section toggles (which sections to include)
    sections: List[str]


# Industry-specific layout configurations with component variants
INDUSTRY_LAYOUTS: Dict[str, Dict[str, Any]] = {
    "Dental Clinic": {
        "hero_variant": "hero_minimal_split",
        "services_variant": "services_glass_cards",
        "about_variant": "about_split_image",
        "contact_variant": "contact_modern",
        "footer_variant": "footer_dark",
        "sections": ["hero", "services", "about", "contact", "footer"],
        "primary_color": "#0D9488",  # Teal - trust & cleanliness
        "accent_color": "#F97316",   # Orange - warmth
        "font_heading": "Montserrat",
        "font_body": "Inter",
        "theme": "light",
        "style": "professional"
    },
    "Medical Clinic": {
        "hero_variant": "hero_minimal_split",
        "services_variant": "services_icon_grid",
        "about_variant": "about_split_image",
        "contact_variant": "contact_modern",
        "footer_variant": "footer_dark",
        "sections": ["hero", "services", "about", "contact", "footer"],
        "primary_color": "#2563EB",  # Blue - trust
        "accent_color": "#10B981",   # Green - health
        "font_heading": "Plus Jakarta Sans",
        "font_body": "Inter",
        "theme": "light",
        "style": "professional"
    },
    "Bakery": {
        "hero_variant": "hero_glass_overlay",
        "services_variant": "services_glass_cards",
        "about_variant": "about_split_image",
        "contact_variant": "contact_modern",
        "footer_variant": "footer_dark",
        "sections": ["hero", "services", "about", "contact", "footer"],
        "primary_color": "#D97706",  # Warm amber
        "accent_color": "#EC4899",   # Pink - sweet
        "font_heading": "Playfair Display",
        "font_body": "Lato",
        "theme": "warm",
        "style": "friendly"
    },
    "Restaurant": {
        "hero_variant": "hero_glass_overlay",
        "services_variant": "services_glass_cards",
        "about_variant": "about_split_image",
        "contact_variant": "contact_modern",
        "footer_variant": "footer_dark",
        "sections": ["hero", "services", "about", "contact", "footer"],
        "primary_color": "#991B1B",  # Deep red - appetite
        "accent_color": "#F59E0B",   # Gold - premium
        "font_heading": "Cormorant Garamond",
        "font_body": "Lato",
        "theme": "dark",
        "style": "luxury"
    },
    "Tuition Center": {
        "hero_variant": "hero_gradient_centered",
        "services_variant": "services_icon_grid",
        "about_variant": "about_split_image",
        "contact_variant": "contact_modern",
        "footer_variant": "footer_dark",
        "sections": ["hero", "services", "about", "contact", "footer"],
        "primary_color": "#7C3AED",  # Purple - wisdom
        "accent_color": "#F97316",   # Orange - energy
        "font_heading": "Poppins",
        "font_body": "Open Sans",
        "theme": "light",
        "style": "friendly"
    },
    "Hardware Store": {
        "hero_variant": "hero_minimal_split",
        "services_variant": "services_icon_grid",
        "about_variant": "about_split_image",
        "contact_variant": "contact_modern",
        "footer_variant": "footer_dark",
        "sections": ["hero", "services", "about", "contact", "footer"],
        "primary_color": "#1D4ED8",  # Blue - reliability
        "accent_color": "#F59E0B",   # Yellow - caution/tools
        "font_heading": "Roboto",
        "font_body": "Roboto",
        "theme": "light",
        "style": "professional"
    },
    "Salon": {
        "hero_variant": "hero_glass_overlay",
        "services_variant": "services_glass_cards",
        "about_variant": "about_split_image",
        "contact_variant": "contact_modern",
        "footer_variant": "footer_dark",
        "sections": ["hero", "services", "about", "contact", "footer"],
        "primary_color": "#DB2777",  # Pink - beauty
        "accent_color": "#8B5CF6",   # Purple - luxury
        "font_heading": "Playfair Display",
        "font_body": "Nunito",
        "theme": "light",
        "style": "luxury"
    },
    "Grocery Store": {
        "hero_variant": "hero_gradient_centered",
        "services_variant": "services_icon_grid",
        "about_variant": "about_split_image",
        "contact_variant": "contact_modern",
        "footer_variant": "footer_dark",
        "sections": ["hero", "services", "about", "contact", "footer"],
        "primary_color": "#059669",  # Green - fresh
        "accent_color": "#F97316",   # Orange - deals
        "font_heading": "Nunito",
        "font_body": "Open Sans",
        "theme": "light",
        "style": "friendly"
    },
    "General Business": {
        "hero_variant": "hero_minimal_split",
        "services_variant": "services_glass_cards",
        "about_variant": "about_split_image",
        "contact_variant": "contact_modern",
        "footer_variant": "footer_dark",
        "sections": ["hero", "services", "about", "contact", "footer"],
        "primary_color": "#0D9488",  # Teal - modern
        "accent_color": "#F97316",   # Orange - CTA
        "font_heading": "Inter",
        "font_body": "Inter",
        "theme": "light",
        "style": "professional"
    }
}

# Tone-based style overrides
TONE_STYLES: Dict[str, Dict[str, Any]] = {
    "Professional": {
        "hero_variant": "hero_minimal_split",
        "services_variant": "services_icon_grid",
        "style": "professional"
    },
    "Friendly": {
        "hero_variant": "hero_gradient_centered",
        "services_variant": "services_glass_cards",
        "style": "friendly"
    },
    "Luxury": {
        "hero_variant": "hero_glass_overlay",
        "services_variant": "services_glass_cards",
        "style": "luxury"
    },
    "Trendy": {
        "hero_variant": "hero_glass_overlay",
        "services_variant": "services_glass_cards",
        "style": "trendy"
    }
}


def select_layout(business_type: str, tone: str = "Friendly") -> LayoutBlueprint:
    """
    Select appropriate layout configuration with component variants for a business.
    
    Args:
        business_type: Type of business (e.g., "Dental Clinic")
        tone: Desired tone ("Professional", "Friendly", "Luxury", "Trendy")
    
    Returns:
        LayoutBlueprint with selected component variants and styling
    """
    # Get industry-specific layout or default
    config = INDUSTRY_LAYOUTS.get(business_type, INDUSTRY_LAYOUTS["General Business"]).copy()
    
    # Apply tone-based overrides if the tone differs from default
    if tone in TONE_STYLES and tone != config.get("style", "").capitalize():
        tone_overrides = TONE_STYLES[tone]
        for key, value in tone_overrides.items():
            config[key] = value
    
    return LayoutBlueprint(**config)


def get_available_layouts() -> List[str]:
    """Get list of available industry layouts."""
    return list(INDUSTRY_LAYOUTS.keys())


def get_available_tones() -> List[str]:
    """Get list of available tones."""
    return list(TONE_STYLES.keys())


def get_component_variants() -> Dict[str, List[str]]:
    """Get available variants for each component type."""
    return {
        "hero": ["hero_glass_overlay", "hero_minimal_split", "hero_gradient_centered"],
        "services": ["services_glass_cards", "services_icon_grid"],
        "about": ["about_split_image"],
        "contact": ["contact_modern"],
        "footer": ["footer_dark"]
    }
