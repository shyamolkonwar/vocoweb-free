"""
Deploy Service Module
Handles publishing websites to static hosting (Cloudflare Pages / local).
"""

import os
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional
from pydantic import BaseModel


class PublishedSite(BaseModel):
    """Published website information."""
    id: str
    subdomain: str
    url: str
    published_at: str
    html_path: str


# Storage paths
DATA_DIR = Path(__file__).parent.parent.parent / "data"
PUBLISHED_DIR = DATA_DIR / "published"
SITES_FILE = DATA_DIR / "published_sites.json"


def ensure_dirs():
    """Ensure required directories exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PUBLISHED_DIR.mkdir(parents=True, exist_ok=True)
    if not SITES_FILE.exists():
        SITES_FILE.write_text("{}")


def generate_subdomain(business_name: str) -> str:
    """
    Generate a URL-friendly subdomain from business name.
    
    Args:
        business_name: The business name to convert
    
    Returns:
        Clean subdomain string
    """
    import re
    # Convert to lowercase and replace spaces
    subdomain = business_name.lower()
    # Remove special characters
    subdomain = re.sub(r'[^a-z0-9\s-]', '', subdomain)
    # Replace spaces with hyphens
    subdomain = re.sub(r'\s+', '-', subdomain)
    # Remove consecutive hyphens
    subdomain = re.sub(r'-+', '-', subdomain)
    # Trim hyphens from ends
    subdomain = subdomain.strip('-')
    # Limit length
    subdomain = subdomain[:30]
    
    return subdomain or 'my-site'


def load_published_sites() -> dict:
    """Load published sites registry."""
    ensure_dirs()
    try:
        return json.loads(SITES_FILE.read_text())
    except json.JSONDecodeError:
        return {}


def save_published_sites(sites: dict):
    """Save published sites registry."""
    ensure_dirs()
    SITES_FILE.write_text(json.dumps(sites, indent=2))


def publish_website(
    website_id: str,
    html_content: str,
    business_name: str,
    base_domain: str = "setu.local"
) -> PublishedSite:
    """
    Publish a website to static hosting.
    
    For MVP, this saves to local file system and returns a local URL.
    Can be upgraded to Cloudflare Pages / Vercel deployment.
    
    Args:
        website_id: Unique website identifier
        html_content: Generated HTML content
        business_name: Business name for subdomain generation
        base_domain: Base domain for the site
    
    Returns:
        PublishedSite with URL and metadata
    """
    ensure_dirs()
    
    # Generate subdomain
    subdomain = generate_subdomain(business_name)
    
    # Check for existing subdomain and make unique if needed
    sites = load_published_sites()
    original_subdomain = subdomain
    counter = 1
    while any(s.get('subdomain') == subdomain for s in sites.values() if s.get('id') != website_id):
        subdomain = f"{original_subdomain}-{counter}"
        counter += 1
    
    # Create site directory
    site_dir = PUBLISHED_DIR / subdomain
    site_dir.mkdir(parents=True, exist_ok=True)
    
    # Write HTML file
    html_path = site_dir / "index.html"
    html_path.write_text(html_content)
    
    # Generate URL (local for MVP, can be replaced with real hosting)
    url = f"http://{subdomain}.{base_domain}"
    
    # For local development, also serve via the API
    api_url = f"http://localhost:8000/sites/{subdomain}"
    
    # Create published site record
    published = PublishedSite(
        id=website_id,
        subdomain=subdomain,
        url=api_url,  # Use API URL for local testing
        published_at=datetime.now().isoformat(),
        html_path=str(html_path)
    )
    
    # Save to registry
    sites[website_id] = published.model_dump()
    save_published_sites(sites)
    
    return published


def get_published_site(website_id: str) -> Optional[PublishedSite]:
    """Get published site by website ID."""
    sites = load_published_sites()
    if website_id in sites:
        return PublishedSite(**sites[website_id])
    return None


def get_site_by_subdomain(subdomain: str) -> Optional[str]:
    """
    Get HTML content for a published site by subdomain.
    
    Args:
        subdomain: The site subdomain
    
    Returns:
        HTML content or None if not found
    """
    html_path = PUBLISHED_DIR / subdomain / "index.html"
    if html_path.exists():
        return html_path.read_text()
    return None


def unpublish_website(website_id: str) -> bool:
    """
    Unpublish a website (remove from hosting).
    
    Args:
        website_id: Website to unpublish
    
    Returns:
        True if successfully unpublished
    """
    sites = load_published_sites()
    if website_id not in sites:
        return False
    
    site = sites[website_id]
    subdomain = site.get('subdomain')
    
    # Remove site directory
    site_dir = PUBLISHED_DIR / subdomain
    if site_dir.exists():
        shutil.rmtree(site_dir)
    
    # Remove from registry
    del sites[website_id]
    save_published_sites(sites)
    
    return True


def republish_website(
    website_id: str,
    html_content: str
) -> Optional[PublishedSite]:
    """
    Republish a website with updated content.
    
    Args:
        website_id: Website to republish
        html_content: New HTML content
    
    Returns:
        Updated PublishedSite or None if not found
    """
    sites = load_published_sites()
    if website_id not in sites:
        return None
    
    site = sites[website_id]
    subdomain = site.get('subdomain')
    
    # Update HTML file
    html_path = PUBLISHED_DIR / subdomain / "index.html"
    html_path.write_text(html_content)
    
    # Update published timestamp
    site['published_at'] = datetime.now().isoformat()
    sites[website_id] = site
    save_published_sites(sites)
    
    return PublishedSite(**site)
