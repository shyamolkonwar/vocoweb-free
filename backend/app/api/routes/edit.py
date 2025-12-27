"""
Edit API Routes
Handles section-based website editing via text or voice.
"""

import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal

from app.api.routes.generate import load_websites, save_website
from app.ai import parse_business_description
from app.website import build_website
from app.ai.layout_selector import LayoutBlueprint
from app.ai.business_parser import BusinessProfile
from app.core.config import get_settings

router = APIRouter()


class SectionEditRequest(BaseModel):
    """Request to edit a website section."""
    section_name: Literal["hero", "services", "about", "contact"]
    new_content: str = Field(..., min_length=3, max_length=1000)
    input_type: Literal["text", "voice"] = "text"


class SectionEditResponse(BaseModel):
    """Response after section edit."""
    success: bool
    section_name: str
    html: str


class SectionInfo(BaseModel):
    """Information about an editable section."""
    name: str
    label: str
    current_content: str
    editable_fields: list[str]


# Section definitions
SECTION_DEFINITIONS = {
    "hero": {
        "label": "Hero Section",
        "fields": ["business_name", "tagline", "description", "cta"]
    },
    "services": {
        "label": "Services",
        "fields": ["services"]
    },
    "about": {
        "label": "About",
        "fields": ["description"]
    },
    "contact": {
        "label": "Contact",
        "fields": ["location"]
    }
}


@router.get("/edit/{website_id}/sections")
async def get_editable_sections(website_id: str):
    """Get list of editable sections with current content."""
    websites = load_websites()
    
    if website_id not in websites:
        raise HTTPException(status_code=404, detail="Website not found")
    
    website = websites[website_id]
    business = website.get("business", {})
    
    sections = []
    for name, config in SECTION_DEFINITIONS.items():
        # Extract current content for this section
        current = {}
        for field in config["fields"]:
            current[field] = business.get(field, "")
        
        sections.append(SectionInfo(
            name=name,
            label=config["label"],
            current_content=json.dumps(current, ensure_ascii=False),
            editable_fields=config["fields"]
        ))
    
    return {
        "website_id": website_id,
        "business_name": business.get("business_name", ""),
        "sections": sections
    }


@router.patch("/edit/{website_id}/section")
async def edit_section(website_id: str, request: SectionEditRequest):
    """
    Edit a specific section of the website.
    
    The new_content is processed by AI to extract relevant updates,
    then the section is regenerated with the new content.
    """
    settings = get_settings()
    websites = load_websites()
    
    if website_id not in websites:
        raise HTTPException(status_code=404, detail="Website not found")
    
    website = websites[website_id]
    business_data = website.get("business", {})
    layout_data = website.get("layout", {})
    language = website.get("language", "en")
    
    try:
        # Update business data based on section and new content
        updated_business = _update_section(
            request.section_name,
            request.new_content,
            business_data,
            settings.openai_api_key
        )
        
        # Recreate BusinessProfile and LayoutBlueprint
        business = BusinessProfile(**updated_business)
        layout = LayoutBlueprint(**layout_data)
        
        # Rebuild website
        html = build_website(business, layout, language)
        
        # Update storage
        website["business"] = updated_business
        website["html"] = html
        website["updated_at"] = datetime.now().isoformat()
        website["edit_history"] = website.get("edit_history", [])
        website["edit_history"].append({
            "section": request.section_name,
            "input_type": request.input_type,
            "timestamp": datetime.now().isoformat()
        })
        
        save_website(website)
        
        return SectionEditResponse(
            success=True,
            section_name=request.section_name,
            html=html
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Edit failed: {str(e)}")


def _update_section(
    section_name: str,
    new_content: str,
    business_data: dict,
    api_key: str
) -> dict:
    """
    Update business data based on section edit.
    Uses AI to intelligently merge new content.
    """
    from openai import OpenAI
    
    updated = business_data.copy()
    
    # For simple updates, directly update fields
    if section_name == "hero":
        # Parse the new content to update hero fields
        client = OpenAI(api_key=api_key)
        
        prompt = f"""Given this edit instruction for a website hero section:
"{new_content}"

Current values:
- Business Name: {business_data.get('business_name', '')}
- Tagline: {business_data.get('tagline', '')}
- Description: {business_data.get('description', '')}
- CTA: {business_data.get('cta', '')}

Return updated values as JSON. Only update fields that the instruction clearly wants to change.
Keep other fields unchanged. Return valid JSON only:
{{"business_name": "...", "tagline": "...", "description": "...", "cta": "..."}}"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300
        )
        
        content = response.choices[0].message.content
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        updates = json.loads(content.strip())
        for key in ["business_name", "tagline", "description", "cta"]:
            if key in updates and updates[key]:
                updated[key] = updates[key]
    
    elif section_name == "services":
        # Parse services from content
        services = [s.strip() for s in new_content.split(",")]
        if services:
            updated["services"] = services[:8]
    
    elif section_name == "about":
        updated["description"] = new_content
    
    elif section_name == "contact":
        updated["location"] = new_content
    
    return updated


@router.post("/edit/{website_id}/quick")
async def quick_edit(website_id: str, field: str, value: str):
    """
    Quick edit a single field without AI processing.
    """
    websites = load_websites()
    
    if website_id not in websites:
        raise HTTPException(status_code=404, detail="Website not found")
    
    website = websites[website_id]
    business_data = website.get("business", {})
    layout_data = website.get("layout", {})
    language = website.get("language", "en")
    
    # Validate field
    valid_fields = ["business_name", "tagline", "description", "cta", "location"]
    if field not in valid_fields:
        raise HTTPException(status_code=400, detail=f"Invalid field. Valid: {valid_fields}")
    
    try:
        # Update the field
        business_data[field] = value
        
        # Rebuild
        business = BusinessProfile(**business_data)
        layout = LayoutBlueprint(**layout_data)
        html = build_website(business, layout, language)
        
        # Save
        website["business"] = business_data
        website["html"] = html
        website["updated_at"] = datetime.now().isoformat()
        save_website(website)
        
        return {"success": True, "field": field, "html": html}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick edit failed: {str(e)}")


class HtmlSaveRequest(BaseModel):
    """Request to save full HTML from visual editor."""
    html: str = Field(..., min_length=100)
    page: str = "index.html"


@router.put("/edit/{website_id}/html")
async def save_html(website_id: str, request: HtmlSaveRequest):
    """
    Save full HTML content from the visual editor.
    This is called when user makes inline edits in the WYSIWYG editor.
    """
    websites = load_websites()
    
    if website_id not in websites:
        raise HTTPException(status_code=404, detail="Website not found")
    
    website = websites[website_id]
    
    try:
        # Clean the HTML (remove editor artifacts like data-lid, lx-selected, etc.)
        cleaned_html = _clean_editor_html(request.html)
        
        # Save HTML
        if request.page == "index.html" or not website.get("pages"):
            # Single-page website: save to html field
            website["html"] = cleaned_html
        else:
            # Multi-page: save to the specific page
            if "pages" not in website:
                website["pages"] = {}
            website["pages"][request.page] = cleaned_html
        
        website["updated_at"] = datetime.now().isoformat()
        website["edit_history"] = website.get("edit_history", [])
        website["edit_history"].append({
            "type": "visual_edit",
            "page": request.page,
            "timestamp": datetime.now().isoformat()
        })
        
        save_website(website)
        
        return {
            "success": True,
            "page": request.page,
            "updated_at": website["updated_at"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")


def _clean_editor_html(html: str) -> str:
    """
    Clean editor artifacts from HTML before saving.
    Removes data-lid attributes, selection classes, and editor scripts.
    """
    import re
    
    # Remove editor styles
    html = re.sub(r'<style id="laxizen-editor-styles">.*?</style>', '', html, flags=re.DOTALL)
    
    # Remove editor script references
    html = re.sub(r'<script src="/scripts/editor-agent\.js"></script>', '', html)
    
    # Remove lx-selected class (but keep other classes)
    html = re.sub(r'\s+class="([^"]*)\blx-selected\b([^"]*)"', lambda m: f' class="{m.group(1)}{m.group(2)}"'.replace('  ', ' ').strip(), html)
    
    # Remove empty class attributes that might result
    html = re.sub(r'\s+class="\s*"', '', html)
    
    # Remove edit indicator elements
    html = re.sub(r'<[^>]*class="[^"]*lx-edit-indicator[^"]*"[^>]*>.*?</[^>]*>', '', html, flags=re.DOTALL)
    
    return html
