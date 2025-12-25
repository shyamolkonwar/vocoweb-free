"""
Celery Background Tasks
All AI-heavy and long-running tasks run here, not in FastAPI.
"""

import os
import json
from datetime import datetime
from pathlib import Path
from celery import chain
from celery.exceptions import SoftTimeLimitExceeded

from app.core.celery_app import celery_app
from app.ai import (
    parse_business_description,
    select_layout,
    transcribe_audio,
    normalize_text,
    extract_business_info,
    create_business_profile_from_extraction,
    BusinessProfile
)
from app.website import build_website
from app.services.scraper import scrape_website, ScrapeError


# Data storage path (same as generate.py)
DATA_DIR = Path(__file__).parent.parent / "data"
WEBSITES_FILE = DATA_DIR / "websites.json"


def ensure_data_dir():
    """Ensure data directory exists."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not WEBSITES_FILE.exists():
        WEBSITES_FILE.write_text("{}")


def load_websites() -> dict:
    """Load websites from storage."""
    ensure_data_dir()
    try:
        return json.loads(WEBSITES_FILE.read_text())
    except json.JSONDecodeError:
        return {}


def save_website(website_data: dict):
    """Save website to storage."""
    websites = load_websites()
    websites[website_data["id"]] = website_data
    WEBSITES_FILE.write_text(json.dumps(websites, indent=2))


# =============================================================================
# WEBSITE GENERATION TASK
# =============================================================================

@celery_app.task(bind=True, name="generate_website")
def generate_website_task(self, description: str, language: str = "en"):
    """
    Generate a website from text description.
    
    Args:
        description: Business description text
        language: 'en' or 'hi'
    
    Returns:
        dict with website_id and status
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    
    try:
        # Step 1: Parse business description
        self.update_state(state="PROGRESS", meta={
            "step": "parsing",
            "message": "Analyzing your business description..."
        })
        
        business = parse_business_description(description, language, api_key)
        
        # Step 2: Select layout
        self.update_state(state="PROGRESS", meta={
            "step": "designing",
            "message": "Choosing the best design for your business..."
        })
        
        layout = select_layout(business.business_type, business.tone)
        
        # Step 3: Build website
        self.update_state(state="PROGRESS", meta={
            "step": "building",
            "message": "Creating your website..."
        })
        
        html = build_website(business, layout, language)
        
        # Step 4: Save website
        website_id = f"site_{int(datetime.now().timestamp())}_{os.urandom(4).hex()}"
        
        website_data = {
            "id": website_id,
            "source_type": "text",
            "language": language,
            "description": description,
            "business": business.model_dump(),
            "layout": layout.model_dump(),
            "html": html,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        save_website(website_data)
        
        return {
            "status": "success",
            "website_id": website_id,
            "business_name": business.business_name,
            "business_type": business.business_type,
            "location": business.location
        }
        
    except SoftTimeLimitExceeded:
        return {
            "status": "failed",
            "error": "Task timed out. Please try again with a shorter description."
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }


# =============================================================================
# SPEECH TO TEXT TASK
# =============================================================================

@celery_app.task(bind=True, name="speech_to_text")
def speech_to_text_task(self, audio_data_b64: str, filename: str, language: str = None):
    """
    Transcribe audio to text.
    
    Args:
        audio_data_b64: Base64 encoded audio bytes
        filename: Original filename
        language: Optional language hint
    
    Returns:
        dict with transcription result
    """
    import base64
    
    api_key = os.getenv("OPENAI_API_KEY", "")
    
    try:
        self.update_state(state="PROGRESS", meta={
            "step": "transcribing",
            "message": "Converting your voice to text..."
        })
        
        # Decode audio
        audio_data = base64.b64decode(audio_data_b64)
        
        # Transcribe
        result = transcribe_audio(audio_data, filename, language, api_key)
        
        # Normalize
        self.update_state(state="PROGRESS", meta={
            "step": "normalizing",
            "message": "Cleaning up the transcription..."
        })
        
        normalized = normalize_text(result.text, result.language)
        
        return {
            "status": "success",
            "raw_text": result.text,
            "normalized_text": normalized.text,
            "detected_language": result.language,
            "duration_seconds": result.duration_seconds
        }
        
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }


# =============================================================================
# VOICE TO WEBSITE TASK (COMBINED)
# =============================================================================

@celery_app.task(bind=True, name="voice_to_website")
def voice_to_website_task(self, audio_data_b64: str, filename: str, language: str = "en"):
    """
    Full voice-to-website pipeline.
    
    Args:
        audio_data_b64: Base64 encoded audio bytes
        filename: Original filename
        language: Language preference
    
    Returns:
        dict with website_id and status
    """
    import base64
    
    api_key = os.getenv("OPENAI_API_KEY", "")
    
    try:
        # Step 1: Transcribe
        self.update_state(state="PROGRESS", meta={
            "step": "transcribing",
            "message": "Converting your voice to text...",
            "progress": 20
        })
        
        audio_data = base64.b64decode(audio_data_b64)
        transcription = transcribe_audio(audio_data, filename, language, api_key)
        
        # Step 2: Normalize
        self.update_state(state="PROGRESS", meta={
            "step": "normalizing",
            "message": "Understanding your business description...",
            "progress": 40
        })
        
        normalized = normalize_text(transcription.text, transcription.language)
        
        # Step 3: Parse business
        self.update_state(state="PROGRESS", meta={
            "step": "parsing",
            "message": "Extracting business information...",
            "progress": 60
        })
        
        business = parse_business_description(normalized.text, language, api_key)
        
        # Step 4: Select layout
        self.update_state(state="PROGRESS", meta={
            "step": "designing",
            "message": "Choosing the perfect design...",
            "progress": 75
        })
        
        layout = select_layout(business.business_type, business.tone)
        
        # Step 5: Build website
        self.update_state(state="PROGRESS", meta={
            "step": "building",
            "message": "Creating your website...",
            "progress": 90
        })
        
        html = build_website(business, layout, language)
        
        # Step 6: Save
        website_id = f"voice_{int(datetime.now().timestamp())}_{os.urandom(4).hex()}"
        
        website_data = {
            "id": website_id,
            "source_type": "voice",
            "language": language,
            "transcription": transcription.text,
            "normalized_text": normalized.text,
            "business": business.model_dump(),
            "layout": layout.model_dump(),
            "html": html,
            "audio_duration": transcription.duration_seconds,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        save_website(website_data)
        
        return {
            "status": "success",
            "website_id": website_id,
            "business_name": business.business_name,
            "business_type": business.business_type,
            "transcription": transcription.text
        }
        
    except SoftTimeLimitExceeded:
        return {
            "status": "failed",
            "error": "Task timed out. Please try recording a shorter message."
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }


# =============================================================================
# REDESIGN WEBSITE TASK
# =============================================================================

@celery_app.task(bind=True, name="redesign_website")
def redesign_website_task(self, url: str, style: str = "modern", language: str = "en"):
    """
    Redesign an existing website from URL.
    
    Args:
        url: Website URL to scrape
        style: Design style (modern, premium, simple)
        language: Output language
    
    Returns:
        dict with website_id and status
    """
    import asyncio
    
    api_key = os.getenv("OPENAI_API_KEY", "")
    
    # Style configurations
    style_configs = {
        "modern": {"tone": "Professional"},
        "premium": {"tone": "Professional"},
        "simple": {"tone": "Friendly"}
    }
    
    try:
        # Step 1: Scrape website
        self.update_state(state="PROGRESS", meta={
            "step": "scraping",
            "message": "Fetching content from your website...",
            "progress": 20
        })
        
        # Run async scraper in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            scraped = loop.run_until_complete(scrape_website(url))
        finally:
            loop.close()
        
        # Step 2: Extract business info
        self.update_state(state="PROGRESS", meta={
            "step": "extracting",
            "message": "Understanding your business...",
            "progress": 40
        })
        
        extracted = extract_business_info(scraped, api_key)
        
        # Step 3: Create business profile
        self.update_state(state="PROGRESS", meta={
            "step": "designing",
            "message": f"Applying {style} design...",
            "progress": 60
        })
        
        style_config = style_configs.get(style, style_configs["modern"])
        business = create_business_profile_from_extraction(extracted, tone=style_config["tone"])
        
        # Step 4: Select layout
        layout = select_layout(business.business_type, business.tone)
        
        # Step 5: Build website
        self.update_state(state="PROGRESS", meta={
            "step": "building",
            "message": "Creating your new website...",
            "progress": 85
        })
        
        html = build_website(business, layout, language)
        
        # Step 6: Save
        website_id = f"redesign_{int(datetime.now().timestamp())}_{os.urandom(4).hex()}"
        
        website_data = {
            "id": website_id,
            "source_type": "redesign",
            "original_url": url,
            "style": style,
            "language": language,
            "business": business.model_dump(),
            "layout": layout.model_dump(),
            "html": html,
            "scraped_data": {
                "title": scraped.title,
                "description": scraped.description
            },
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        save_website(website_data)
        
        return {
            "status": "success",
            "website_id": website_id,
            "business_name": business.business_name,
            "original_url": url,
            "style": style
        }
        
    except ScrapeError as e:
        return {
            "status": "failed",
            "error": str(e)
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }
