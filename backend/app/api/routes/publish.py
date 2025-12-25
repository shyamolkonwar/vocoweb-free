"""
Publish API Routes
Handles website publishing and serving.
"""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from app.services import (
    publish_website,
    unpublish_website,
    republish_website,
    get_published_site,
    get_site_by_subdomain
)

router = APIRouter()

# Data storage
DATA_DIR = Path(__file__).parent.parent.parent / "data"
WEBSITES_FILE = DATA_DIR / "websites.json"


def load_websites() -> dict:
    """Load websites from storage."""
    try:
        return json.loads(WEBSITES_FILE.read_text())
    except:
        return {}


class PublishResponse(BaseModel):
    """Response after publishing."""
    id: str
    subdomain: str
    url: str
    published_at: str
    message: str


@router.post("/publish/{website_id}", response_model=PublishResponse)
async def publish_site(website_id: str):
    """
    Publish a generated website to make it live.
    
    Creates a unique subdomain and serves the static HTML.
    """
    websites = load_websites()
    
    if website_id not in websites:
        raise HTTPException(status_code=404, detail="Website not found")
    
    website = websites[website_id]
    html_content = website.get("html")
    business_name = website.get("business", {}).get("business_name", "my-site")
    
    if not html_content:
        raise HTTPException(status_code=400, detail="Website has no content to publish")
    
    try:
        published = publish_website(
            website_id=website_id,
            html_content=html_content,
            business_name=business_name
        )
        
        return PublishResponse(
            id=website_id,
            subdomain=published.subdomain,
            url=published.url,
            published_at=published.published_at,
            message="Website published successfully! 🎉"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Publishing failed: {str(e)}")


@router.post("/republish/{website_id}", response_model=PublishResponse)
async def republish_site(website_id: str):
    """
    Republish a website with updated content.
    
    Keeps the same subdomain but updates the HTML.
    """
    websites = load_websites()
    
    if website_id not in websites:
        raise HTTPException(status_code=404, detail="Website not found")
    
    website = websites[website_id]
    html_content = website.get("html")
    
    if not html_content:
        raise HTTPException(status_code=400, detail="Website has no content to publish")
    
    published = get_published_site(website_id)
    if not published:
        raise HTTPException(status_code=404, detail="Website not published yet")
    
    try:
        updated = republish_website(website_id, html_content)
        
        return PublishResponse(
            id=website_id,
            subdomain=updated.subdomain,
            url=updated.url,
            published_at=updated.published_at,
            message="Website updated successfully!"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Republishing failed: {str(e)}")


@router.delete("/publish/{website_id}")
async def unpublish_site(website_id: str):
    """Unpublish a website (take it offline)."""
    success = unpublish_website(website_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Published site not found")
    
    return {"message": "Website unpublished successfully", "id": website_id}


@router.get("/publish/{website_id}/status")
async def get_publish_status(website_id: str):
    """Get the publishing status of a website."""
    published = get_published_site(website_id)
    
    if published:
        return {
            "published": True,
            "subdomain": published.subdomain,
            "url": published.url,
            "published_at": published.published_at
        }
    
    return {"published": False}
