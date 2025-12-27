"""
Website Builder Module
Assembles modern websites using Jinja2 templates and Tailwind CSS.
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape

from ..ai.business_parser import BusinessProfile
from ..ai.layout_selector import LayoutBlueprint


# Template directory path
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"


def get_jinja_env() -> Environment:
    """Create and configure Jinja2 environment."""
    return Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(['html', 'xml']),
        trim_blocks=True,
        lstrip_blocks=True
    )


def get_labels(language: str) -> Dict[str, str]:
    """Get localized labels for the website."""
    is_hindi = language == "hi"
    
    return {
        # Navigation
        "services": "हमारी सेवाएं" if is_hindi else "Our Services",
        "about": "हमारे बारे में" if is_hindi else "About Us",
        "contact": "संपर्क करें" if is_hindi else "Contact Us",
        
        # Hero
        "learn_more": "और जानें" if is_hindi else "Learn More",
        "our_services": "हमारी सेवाएं" if is_hindi else "Our Services",
        "happy_customers": "खुश ग्राहक" if is_hindi else "Happy Customers",
        "years_experience": "वर्षों का अनुभव" if is_hindi else "Years Experience",
        "rating": "रेटिंग" if is_hindi else "Rating",
        "trusted": "विश्वसनीय" if is_hindi else "Trusted",
        "quality_service": "गुणवत्ता सेवा" if is_hindi else "Quality Service",
        "call_now": "अभी कॉल करें" if is_hindi else "Call Now",
        
        # Services
        "what_we_offer": "हम क्या प्रदान करते हैं" if is_hindi else "What We Offer",
        "services_subtitle": "आपकी सभी जरूरतों के लिए विशेषज्ञ समाधान" if is_hindi else "Expert solutions for all your needs",
        "service_description": "पेशेवर सेवा उच्चतम गुणवत्ता के साथ" if is_hindi else "Professional service delivered with the highest quality",
        "get_started": "शुरू करें" if is_hindi else "Get Started",
        "need_help": "मदद चाहिए? हमसे संपर्क करें" if is_hindi else "Need help? Contact us today",
        "contact_us": "संपर्क करें" if is_hindi else "Contact Us",
        
        # About
        "about_us": "हमारे बारे में" if is_hindi else "About Us",
        "about_headline": "उत्कृष्टता के लिए प्रतिबद्ध" if is_hindi else "Committed to Excellence",
        "years_of_excellence": "उत्कृष्टता के वर्ष" if is_hindi else "Years of Excellence",
        "feature_1_title": "विशेषज्ञ टीम" if is_hindi else "Expert Team",
        "feature_1_desc": "हमारी टीम में अनुभवी पेशेवर हैं" if is_hindi else "Our team consists of experienced professionals",
        "feature_2_title": "गुणवत्ता सेवा" if is_hindi else "Quality Service",
        "feature_2_desc": "हम गुणवत्ता से कोई समझौता नहीं करते" if is_hindi else "We never compromise on quality",
        "feature_3_title": "ग्राहक संतुष्टि" if is_hindi else "Customer Satisfaction",
        "feature_3_desc": "आपकी संतुष्टि हमारी प्राथमिकता है" if is_hindi else "Your satisfaction is our priority",
        "get_in_touch": "संपर्क में रहें" if is_hindi else "Get In Touch",
        
        # Contact
        "contact_subtitle": "हमसे जुड़ें, हम आपकी सेवा में हैं" if is_hindi else "Reach out to us, we're here to help",
        "location": "स्थान" if is_hindi else "Location",
        "phone": "फोन" if is_hindi else "Phone",
        "hours": "समय" if is_hindi else "Hours",
        "open_hours": "सोमवार - शनिवार: सुबह 9 बजे - रात 8 बजे" if is_hindi else "Monday - Saturday: 9 AM - 8 PM",
        "ready_to_start": "शुरू करने के लिए तैयार?" if is_hindi else "Ready to Get Started?",
        "cta_description": "आज ही हमसे संपर्क करें और अपनी जरूरतों के बारे में बताएं" if is_hindi else "Contact us today and let us know about your needs",
        
        # Footer
        "quick_links": "त्वरित लिंक" if is_hindi else "Quick Links",
        "contact_info": "संपर्क जानकारी" if is_hindi else "Contact Info",
        "all_rights_reserved": "सर्वाधिकार सुरक्षित" if is_hindi else "All Rights Reserved",
        "powered_by": "द्वारा संचालित" if is_hindi else "Powered by",
        "follow": "हमें फॉलो करें" if is_hindi else "Follow Us",
    }


def get_business_icon(business_type: str) -> str:
    """Get an emoji/icon for the business type."""
    icons = {
        "Dental Clinic": "🦷",
        "Medical Clinic": "🏥",
        "Bakery": "🥐",
        "Restaurant": "🍽️",
        "Tuition Center": "📚",
        "Hardware Store": "🔧",
        "Salon": "💇",
        "Grocery Store": "🛒",
        "General Business": "🏢"
    }
    return icons.get(business_type, "🏢")


def inject_navigation_script(html_content: str) -> str:
    """
    Inject a postMessage-based navigation interceptor into HTML content.
    This allows multi-page preview navigation without breaking out of the iframe.
    
    Args:
        html_content: The HTML string to inject the script into
        
    Returns:
        HTML with navigation interceptor script injected
    """
    script = """
    <script>
      (function() {
        // Preview Navigation Interceptor
        document.addEventListener('DOMContentLoaded', function() {
          document.body.addEventListener('click', function(e) {
            var link = e.target.closest('a');
            
            if (link) {
              var href = link.getAttribute('href');
              
              // Skip external links, anchors, tel/mailto
              if (!href) return;
              if (href.startsWith('http://') || href.startsWith('https://')) return;
              if (href.startsWith('#')) return;
              if (href.startsWith('tel:') || href.startsWith('mailto:')) return;
              if (href.startsWith('javascript:')) return;
              
              // Internal link - intercept and send to parent
              e.preventDefault();
              e.stopPropagation();
              
              // Send message to parent (Next.js preview page)
              window.parent.postMessage({
                type: 'NAVIGATE_PREVIEW',
                payload: href
              }, '*');
            }
          }, true);
        });
      })();
    </script>
    """
    
    # Inject before </body> or at end
    if '</body>' in html_content:
        return html_content.replace('</body>', f'{script}</body>')
    elif '</html>' in html_content:
        return html_content.replace('</html>', f'{script}</html>')
    else:
        return html_content + script


async def build_website(
    business: BusinessProfile,
    layout: LayoutBlueprint,
    language: str = "en",
    images: Optional[Dict[str, str]] = None
) -> str:
    """
    Generate complete HTML website by assembling Jinja2 templates.
    
    Args:
        business: Structured business information
        layout: Layout configuration with component variants
        language: Output language ('en' or 'hi')
        images: Optional dict with 'hero' and 'about' image URLs
    
    Returns:
        Complete HTML string for the website
    """
    env = get_jinja_env()
    labels = get_labels(language)
    
    # Get images from Pexels if not provided
    if images is None:
        from ..services.pexels_service import get_pexels_service
        pexels = get_pexels_service()
        images = await pexels.get_images_for_website(business.business_type)
    
    # Common context for all templates
    base_context = {
        # Business info
        "business_name": business.business_name,
        "business_type": business.business_type,
        "business_icon": get_business_icon(business.business_type),
        "location": business.location,
        "tagline": business.tagline,
        "description": business.description,
        "services": business.services,
        "cta": business.cta,
        
        # Styling
        "primary_color": layout.primary_color,
        "accent_color": layout.accent_color,
        "font_heading": layout.font_heading,
        "font_body": layout.font_body,
        
        # Images
        "hero_image": images.get("hero", ""),
        "about_image": images.get("about", ""),
        
        # Labels
        "labels": labels,
        
        # Language
        "language": language,
        
        # Meta
        "meta_description": business.description[:160],
        "current_year": datetime.now().year
    }
    
    # Render each component
    hero_section = env.get_template(f"heroes/{layout.hero_variant}.html").render(**base_context)
    services_section = env.get_template(f"services/{layout.services_variant}.html").render(**base_context)
    about_section = env.get_template(f"about/{layout.about_variant}.html").render(**base_context)
    contact_section = env.get_template(f"contact/{layout.contact_variant}.html").render(**base_context)
    footer_section = env.get_template(f"footer/{layout.footer_variant}.html").render(**base_context)
    
    # Assemble into base template
    full_context = {
        **base_context,
        "hero_section": hero_section,
        "services_section": services_section,
        "about_section": about_section,
        "contact_section": contact_section,
        "footer_section": footer_section
    }
    
    return env.get_template("base.html").render(**full_context)


def build_website_sync(
    business: BusinessProfile,
    layout: LayoutBlueprint,
    language: str = "en",
    images: Optional[Dict[str, str]] = None
) -> str:
    """
    Synchronous version of build_website for use in Celery tasks.
    Uses fallback images instead of async Pexels API.
    """
    env = get_jinja_env()
    labels = get_labels(language)
    
    # Use fallback images if not provided
    if images is None:
        from ..services.pexels_service import FALLBACK_IMAGES
        fallback = FALLBACK_IMAGES.get(business.business_type, FALLBACK_IMAGES["General Business"])
        images = {
            "hero": fallback.get("hero", ""),
            "about": fallback.get("about", "")
        }
    
    # Common context for all templates
    base_context = {
        # Business info
        "business_name": business.business_name,
        "business_type": business.business_type,
        "business_icon": get_business_icon(business.business_type),
        "location": business.location,
        "tagline": business.tagline,
        "description": business.description,
        "services": business.services,
        "cta": business.cta,
        
        # Styling
        "primary_color": layout.primary_color,
        "accent_color": layout.accent_color,
        "font_heading": layout.font_heading,
        "font_body": layout.font_body,
        
        # Images
        "hero_image": images.get("hero", ""),
        "about_image": images.get("about", ""),
        
        # Labels
        "labels": labels,
        
        # Language
        "language": language,
        
        # Meta
        "meta_description": business.description[:160],
        "current_year": datetime.now().year
    }
    
    # Render each component
    hero_section = env.get_template(f"heroes/{layout.hero_variant}.html").render(**base_context)
    services_section = env.get_template(f"services/{layout.services_variant}.html").render(**base_context)
    about_section = env.get_template(f"about/{layout.about_variant}.html").render(**base_context)
    contact_section = env.get_template(f"contact/{layout.contact_variant}.html").render(**base_context)
    footer_section = env.get_template(f"footer/{layout.footer_variant}.html").render(**base_context)
    
    # Assemble into base template
    full_context = {
        **base_context,
        "hero_section": hero_section,
        "services_section": services_section,
        "about_section": about_section,
        "contact_section": contact_section,
        "footer_section": footer_section
    }
    
    return env.get_template("base.html").render(**full_context)


# ============================================
# MULTI-PAGE BUILDER (v2.0)
# ============================================

def get_page_config() -> Dict[str, Dict[str, Any]]:
    """Define the pages to generate for multi-page websites."""
    return {
        "index.html": {
            "title_suffix": "",
            "sections": ["hero", "services_preview", "testimonials", "cta"],
            "show_popup": True,
        },
        "services.html": {
            "title_suffix": " - Services",
            "sections": ["services_full"],
            "show_popup": False,
        },
        "about.html": {
            "title_suffix": " - About Us",
            "sections": ["about_full", "team"],
            "show_popup": False,
        },
        "contact.html": {
            "title_suffix": " - Contact",
            "sections": ["contact_form", "map"],
            "show_popup": False,
        },
    }


def get_navigation_config(business_name: str, language: str = "en") -> list:
    """Generate navigation links for multi-page website."""
    labels = get_labels(language)
    return [
        {"url": "index.html", "label": labels.get("home", "Home")},
        {"url": "services.html", "label": labels.get("services", "Services")},
        {"url": "about.html", "label": labels.get("about", "About Us")},
        {"url": "contact.html", "label": labels.get("contact", "Contact")},
    ]


async def build_multipage_website(
    business: BusinessProfile,
    layout: LayoutBlueprint,
    language: str = "en",
    images: Optional[Dict[str, str]] = None,
    website_id: Optional[str] = None,
    api_url: str = "https://api.laxizen.fun",
    popup_config: Optional[Dict[str, Any]] = None
) -> Dict[str, str]:
    """
    Generate a multi-page website as a dictionary of HTML files.
    
    Args:
        business: Structured business information
        layout: Layout configuration with component variants
        language: Output language ('en' or 'hi')
        images: Optional dict with image URLs
        website_id: UUID for lead form submissions
        api_url: Backend API URL for forms
        popup_config: Optional popup settings
    
    Returns:
        Dict mapping filenames to HTML content
    """
    env = get_jinja_env()
    labels = get_labels(language)
    
    # Get images from Pexels if not provided
    if images is None:
        from ..services.pexels_service import get_pexels_service
        pexels = get_pexels_service()
        images = await pexels.get_images_for_website(business.business_type)
    
    # Navigation config
    pages = get_navigation_config(business.business_name, language)
    
    # Default popup config
    if popup_config is None:
        popup_config = {
            "enabled": True,
            "headline": "Get a Free Quote!",
            "subheadline": "Fill in your details and we'll get back to you.",
            "offer_text": None,
            "trigger_type": "time",
            "trigger_delay_seconds": 5,
        }
    
    # Common context for all templates
    base_context = {
        # Business info
        "business_name": business.business_name,
        "business_type": business.business_type,
        "business_icon": get_business_icon(business.business_type),
        "location": business.location,
        "tagline": business.tagline,
        "description": business.description,
        "services": business.services,
        "cta": business.cta,
        
        # Styling
        "primary_color": layout.primary_color,
        "accent_color": layout.accent_color,
        "font_heading": layout.font_heading,
        "font_body": layout.font_body,
        
        # Images
        "hero_image": images.get("hero", ""),
        "about_image": images.get("about", ""),
        "services_image": images.get("services", ""),
        
        # Labels
        "labels": labels,
        
        # Language
        "language": language,
        
        # Navigation
        "pages": pages,
        
        # Lead capture
        "website_id": website_id or "",
        "api_url": api_url,
        
        # Popup
        "popup_enabled": popup_config.get("enabled", True),
        "popup_headline": popup_config.get("headline", "Get a Free Quote!"),
        "popup_subheadline": popup_config.get("subheadline", ""),
        "offer_text": popup_config.get("offer_text"),
        "popup_trigger": popup_config.get("trigger_type", "time"),
        "popup_delay": popup_config.get("trigger_delay_seconds", 5),
        
        # Meta
        "meta_description": business.description[:160],
        "current_year": datetime.now().year
    }
    
    output_pages = {}
    
    # Generate INDEX.HTML (Home)
    index_context = {
        **base_context,
        "page_title": business.business_name,
        "current_page": "index",
        "hero_section": env.get_template(f"heroes/{layout.hero_variant}.html").render(**base_context),
        "services_section": env.get_template(f"services/{layout.services_variant}.html").render(**base_context),
        "contact_section": "",  # Not on home page
        "about_section": "",  # Summary only
        "footer_section": env.get_template(f"footer/{layout.footer_variant}.html").render(**base_context),
        "popup_section": env.get_template("forms/modal_popup.html").render(**base_context) if popup_config.get("enabled", True) else "",
    }
    output_pages["index.html"] = env.get_template("base.html").render(**index_context)
    
    # Generate SERVICES.HTML
    services_context = {
        **base_context,
        "page_title": f"{business.business_name} - Services",
        "current_page": "services",
        "hero_section": f"""
            <section class="pt-32 pb-16 px-4" style="background: linear-gradient(135deg, {layout.primary_color}10 0%, {layout.accent_color}05 100%);">
                <div class="max-w-4xl mx-auto text-center">
                    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4" style="font-family: '{layout.font_heading}', sans-serif;">
                        {labels.get('our_services', 'Our Services')}
                    </h1>
                    <p class="text-xl text-gray-600">{labels.get('services_subtitle', 'Professional solutions tailored to your needs')}</p>
                </div>
            </section>
        """,
        "services_section": env.get_template(f"services/{layout.services_variant}.html").render(**base_context),
        "contact_section": "",
        "about_section": "",
        "footer_section": env.get_template(f"footer/{layout.footer_variant}.html").render(**base_context),
        "popup_section": "",
    }
    output_pages["services.html"] = env.get_template("base.html").render(**services_context)
    
    # Generate ABOUT.HTML
    about_context = {
        **base_context,
        "page_title": f"{business.business_name} - About Us",
        "current_page": "about",
        "hero_section": f"""
            <section class="pt-32 pb-16 px-4" style="background: linear-gradient(135deg, {layout.primary_color}10 0%, {layout.accent_color}05 100%);">
                <div class="max-w-4xl mx-auto text-center">
                    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4" style="font-family: '{layout.font_heading}', sans-serif;">
                        {labels.get('about_us', 'About Us')}
                    </h1>
                    <p class="text-xl text-gray-600">{labels.get('about_headline', 'Committed to Excellence')}</p>
                </div>
            </section>
        """,
        "services_section": "",
        "contact_section": "",
        "about_section": env.get_template(f"about/{layout.about_variant}.html").render(**base_context),
        "footer_section": env.get_template(f"footer/{layout.footer_variant}.html").render(**base_context),
        "popup_section": "",
    }
    output_pages["about.html"] = env.get_template("base.html").render(**about_context)
    
    # Generate CONTACT.HTML
    contact_context = {
        **base_context,
        "page_title": f"{business.business_name} - Contact",
        "current_page": "contact",
        "form_headline": labels.get("get_in_touch", "Get In Touch"),
        "form_subheadline": labels.get("contact_subtitle", "We'd love to hear from you"),
        "hero_section": f"""
            <section class="pt-32 pb-16 px-4" style="background: linear-gradient(135deg, {layout.primary_color}10 0%, {layout.accent_color}05 100%);">
                <div class="max-w-4xl mx-auto text-center">
                    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4" style="font-family: '{layout.font_heading}', sans-serif;">
                        {labels.get('contact_us', 'Contact Us')}
                    </h1>
                    <p class="text-xl text-gray-600">{labels.get('contact_subtitle', "We'd love to hear from you")}</p>
                </div>
            </section>
        """,
        "services_section": "",
        "contact_section": env.get_template(f"contact/{layout.contact_variant}.html").render(**base_context),
        "about_section": "",
        "footer_section": env.get_template(f"footer/{layout.footer_variant}.html").render(**base_context),
        "popup_section": "",
        # Include inline form
        "inline_form": env.get_template("forms/inline_booking_form.html").render(**base_context),
    }
    output_pages["contact.html"] = env.get_template("base.html").render(**contact_context)
    
    # Inject navigation script into all pages for multi-page preview
    for page_name in output_pages:
        output_pages[page_name] = inject_navigation_script(output_pages[page_name])
    
    return output_pages


def build_multipage_website_sync(
    business: BusinessProfile,
    layout: LayoutBlueprint,
    language: str = "en",
    images: Optional[Dict[str, str]] = None,
    website_id: Optional[str] = None,
    api_url: str = "https://api.laxizen.fun",
    popup_config: Optional[Dict[str, Any]] = None
) -> Dict[str, str]:
    """
    Synchronous version of build_multipage_website for Celery tasks.
    """
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        # Use fallback images for sync version
        if images is None:
            from ..services.pexels_service import FALLBACK_IMAGES
            fallback = FALLBACK_IMAGES.get(business.business_type, FALLBACK_IMAGES["General Business"])
            images = {
                "hero": fallback.get("hero", ""),
                "about": fallback.get("about", ""),
                "services": fallback.get("hero", ""),  # Reuse hero for services
            }
        
        return loop.run_until_complete(
            build_multipage_website(
                business=business,
                layout=layout,
                language=language,
                images=images,
                website_id=website_id,
                api_url=api_url,
                popup_config=popup_config
            )
        )
    finally:
        loop.close()

