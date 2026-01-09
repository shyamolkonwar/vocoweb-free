"""
Theme Service Module
Provides 5 preset color palettes for website generation.
"""

from typing import TypedDict

class ThemeColors(TypedDict):
    """Color palette structure."""
    primary: str
    accent: str
    text_dark: str
    text_light: str
    name: str
    description: str


# The 5 Strategic Color Palettes
THEMES: dict[str, ThemeColors] = {
    "trust": {
        "primary": "#0F766E",       # Deep Teal
        "accent": "#CCFBF1",        # Light Mint
        "text_dark": "#0F172A",     # Slate 900
        "text_light": "#FFFFFF",    # White
        "name": "Trust",
        "description": "Professional & Reliable - Perfect for clinics, consultants, corporate"
    },
    "warmth": {
        "primary": "#C2410C",       # Burnt Orange
        "accent": "#FFF7ED",        # Soft Cream
        "text_dark": "#0F172A",     # Slate 900
        "text_light": "#FFFFFF",    # White
        "name": "Warmth",
        "description": "Friendly & Inviting - Perfect for bakeries, restaurants, home decor"
    },
    "growth": {
        "primary": "#15803D",       # Forest Green
        "accent": "#ECFCCB",        # Pale Lime
        "text_dark": "#0F172A",     # Slate 900
        "text_light": "#FFFFFF",    # White
        "name": "Growth",
        "description": "Natural & Healthy - Perfect for ayurveda, landscaping, wellness"
    },
    "modern": {
        "primary": "#4F46E5",       # Electric Indigo
        "accent": "#F3F4F6",        # Cool Grey
        "text_dark": "#0F172A",     # Slate 900
        "text_light": "#FFFFFF",    # White
        "name": "Modern",
        "description": "Tech & Innovation - Perfect for tech, tuition centers, agencies"
    },
    "luxury": {
        "primary": "#18181B",       # Charcoal Black
        "accent": "#D4AF37",        # Gold
        "text_dark": "#0F172A",     # Slate 900
        "text_light": "#FFFFFF",    # White
        "name": "Luxury",
        "description": "Premium & Elegant - Perfect for law firms, salons, jewelry"
    }
}

# Market-specific defaults
DEFAULT_THEME_INDIA = "warmth"      # Warmer colors test better in India
DEFAULT_THEME_GLOBAL = "trust"      # Trust/professional for global


def get_theme(theme_id: str | None, market: str = "GLOBAL") -> ThemeColors:
    """
    Get theme colors by ID or use market-appropriate default.
    
    Args:
        theme_id: Theme identifier (trust, warmth, growth, modern, luxury)
        market: Market code (IN, GLOBAL)
    
    Returns:
        ThemeColors dictionary with hex values
    """
    if theme_id and theme_id in THEMES:
        return THEMES[theme_id]
    
    # Use market-specific default
    if market == "IN":
        return THEMES[DEFAULT_THEME_INDIA]
    return THEMES[DEFAULT_THEME_GLOBAL]


def get_all_themes() -> dict[str, ThemeColors]:
    """Get all available themes for frontend selector."""
    return THEMES


def get_theme_ids() -> list[str]:
    """Get list of valid theme IDs."""
    return list(THEMES.keys())
