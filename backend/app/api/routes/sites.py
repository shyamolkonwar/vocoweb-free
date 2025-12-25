"""
Sites Router - Serves published websites
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

from app.services import get_site_by_subdomain

router = APIRouter()


@router.get("/{subdomain}", response_class=HTMLResponse)
async def serve_site(subdomain: str):
    """
    Serve a published website by its subdomain.
    
    This allows viewing published sites at /sites/{subdomain}
    """
    html_content = get_site_by_subdomain(subdomain)
    
    if not html_content:
        raise HTTPException(status_code=404, detail="Site not found")
    
    return HTMLResponse(content=html_content)
