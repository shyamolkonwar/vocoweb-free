"""
Pexels Image Service
Fetches high-quality stock photos from Pexels API for website generation.
"""

import httpx
from typing import Optional, List, Dict, Any
from functools import lru_cache


# Industry-specific search keywords for best results
INDUSTRY_KEYWORDS: Dict[str, List[str]] = {
    "Dental Clinic": ["dental clinic interior", "dentist office", "dental care", "modern dentist"],
    "Medical Clinic": ["medical clinic", "doctor office", "healthcare facility", "modern hospital"],
    "Bakery": ["bakery interior", "fresh bread", "pastry shop", "artisan bakery"],
    "Restaurant": ["restaurant interior", "fine dining", "cafe ambiance", "food service"],
    "Tuition Center": ["education classroom", "tutoring session", "students learning", "study room"],
    "Hardware Store": ["hardware store", "tools shop", "construction supplies", "home improvement"],
    "Salon": ["beauty salon", "hair salon interior", "spa treatment", "modern salon"],
    "Grocery Store": ["grocery store", "supermarket", "fresh produce", "food market"],
    "General Business": ["modern office", "business professional", "corporate interior", "workspace"],
}

# Fallback curated images (high-quality Pexels IDs) for each industry
FALLBACK_IMAGES: Dict[str, Dict[str, str]] = {
    "Dental Clinic": {
        "hero": "https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=1920",
        "about": "https://images.pexels.com/photos/3845653/pexels-photo-3845653.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },
    "Medical Clinic": {
        "hero": "https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=1920",
        "about": "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },
    "Bakery": {
        "hero": "https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=1920",
        "about": "https://images.pexels.com/photos/1998634/pexels-photo-1998634.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },
    "Restaurant": {
        "hero": "https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=1920",
        "about": "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },
    "Tuition Center": {
        "hero": "https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=1920",
        "about": "https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },
    "Hardware Store": {
        "hero": "https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=1920",
        "about": "https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },
    "Salon": {
        "hero": "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1920",
        "about": "https://images.pexels.com/photos/3738355/pexels-photo-3738355.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },
    "Grocery Store": {
        "hero": "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=1920",
        "about": "https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg?auto=compress&cs=tinysrgb&w=1200"
    },
    "General Business": {
        "hero": "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=1920",
        "about": "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1200"
    }
}


class PexelsService:
    """Service for fetching images from Pexels API."""
    
    BASE_URL = "https://api.pexels.com/v1"
    
    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            headers={"Authorization": api_key} if api_key else {},
            timeout=10.0
        )
    
    async def search_photos(
        self, 
        query: str, 
        per_page: int = 5,
        orientation: str = "landscape"
    ) -> List[Dict[str, Any]]:
        """
        Search for photos on Pexels.
        
        Args:
            query: Search query string
            per_page: Number of results (max 80)
            orientation: 'landscape', 'portrait', or 'square'
            
        Returns:
            List of photo objects with URLs
        """
        if not self.api_key:
            return []
        
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/search",
                params={
                    "query": query,
                    "per_page": per_page,
                    "orientation": orientation
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get("photos", [])
        except Exception as e:
            print(f"Pexels API error: {e}")
            return []
    
    async def get_industry_image(
        self, 
        business_type: str, 
        image_type: str = "hero"
    ) -> str:
        """
        Get a suitable image for a business type.
        
        Args:
            business_type: Type of business (e.g., "Dental Clinic")
            image_type: 'hero' or 'about'
            
        Returns:
            URL to the image
        """
        # Get industry-specific keywords
        keywords = INDUSTRY_KEYWORDS.get(business_type, INDUSTRY_KEYWORDS["General Business"])
        
        # Try to fetch from Pexels API
        if self.api_key:
            photos = await self.search_photos(keywords[0], per_page=3)
            if photos:
                # Return the large2x or original size
                photo = photos[0]
                src = photo.get("src", {})
                return src.get("large2x") or src.get("original") or src.get("large", "")
        
        # Fallback to curated images
        fallbacks = FALLBACK_IMAGES.get(business_type, FALLBACK_IMAGES["General Business"])
        return fallbacks.get(image_type, fallbacks.get("hero", ""))
    
    async def get_images_for_website(self, business_type: str) -> Dict[str, str]:
        """
        Get all necessary images for a website.
        
        Args:
            business_type: Type of business
            
        Returns:
            Dict with 'hero' and 'about' image URLs
        """
        hero_image = await self.get_industry_image(business_type, "hero")
        about_image = await self.get_industry_image(business_type, "about")
        
        return {
            "hero": hero_image,
            "about": about_image
        }
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Global instance (lazy initialized)
_pexels_service: Optional[PexelsService] = None


def get_pexels_service() -> PexelsService:
    """Get the Pexels service instance."""
    global _pexels_service
    if _pexels_service is None:
        from app.core.config import get_settings
        settings = get_settings()
        _pexels_service = PexelsService(api_key=settings.pexels_api_key)
    return _pexels_service
