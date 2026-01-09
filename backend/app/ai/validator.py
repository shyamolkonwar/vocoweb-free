"""
Website Validator Module
Uses a cheap AI model (GPT-4o-mini) to validate that all mandatory sections are present.
"""

import os
import json
from typing import Dict, List
from openai import OpenAI


# Mandatory sections by market
MANDATORY_SECTIONS = {
    "IN": [
        "sticky navbar",
        "hero section",
        "services section",
        "about/trust section", 
        "social proof/testimonials",
        "location/contact section",
        "business hours",
        "sticky mobile footer",
        "footer"
    ],
    "GLOBAL": [
        "sticky navbar",
        "authority hero section",
        "offer/services section",
        "about/credibility section",
        "social proof/testimonials",
        "booking/cta section",
        "footer"
    ]
}


def validate_website(html: str, market: str = "GLOBAL") -> Dict:
    """
    Validate that all mandatory sections are present in the generated HTML.
    
    Args:
        html: The generated HTML string
        market: Market segment ("IN" or "GLOBAL")
    
    Returns:
        Dict with:
        - valid: bool - Whether all mandatory sections are present
        - missing_sections: List[str] - List of missing section names
        - suggestions: str - Brief suggestions for repair
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # Fallback: basic string matching
        return _fallback_validation(html, market)
    
    try:
        client = OpenAI(api_key=api_key)
        
        mandatory = MANDATORY_SECTIONS.get(market, MANDATORY_SECTIONS["GLOBAL"])
        mandatory_list = "\n".join([f"- {s}" for s in mandatory])
        
        validation_prompt = f"""You are a website validation assistant.
Analyze this HTML code and check if ALL of these mandatory sections are present:

{mandatory_list}

HTML CODE:
```html
{html[:15000]}  
```

Respond with ONLY a JSON object (no markdown, no explanation):
{{
  "valid": true/false,
  "missing_sections": ["section1", "section2"],
  "found_sections": ["section1", "section2", ...],
  "suggestions": "Brief suggestion for what's missing or 'All sections present'"
}}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": validation_prompt}],
            temperature=0.1,
            max_tokens=500
        )
        
        content = response.choices[0].message.content.strip()
        
        # Clean JSON if wrapped in markdown
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        result = json.loads(content)
        return {
            "valid": result.get("valid", False),
            "missing_sections": result.get("missing_sections", []),
            "found_sections": result.get("found_sections", []),
            "suggestions": result.get("suggestions", "")
        }
        
    except Exception as e:
        print(f"[Validator] Error: {e}")
        return _fallback_validation(html, market)


def _fallback_validation(html: str, market: str) -> Dict:
    """
    Basic string-matching fallback validation when AI is unavailable.
    """
    html_lower = html.lower()
    mandatory = MANDATORY_SECTIONS.get(market, MANDATORY_SECTIONS["GLOBAL"])
    
    # Simple keyword mapping for fallback
    keyword_map = {
        "sticky navbar": ["nav", "navbar", "header"],
        "hero section": ["hero", "min-h-screen", "above-the-fold"],
        "authority hero section": ["hero", "min-h-screen"],
        "services section": ["services", "what we offer", "our services"],
        "offer/services section": ["services", "offer", "how i can help"],
        "about/trust section": ["about", "trust", "who we are"],
        "about/credibility section": ["about", "credibility", "who i am"],
        "social proof/testimonials": ["testimonial", "review", "client", "social proof"],
        "location/contact section": ["contact", "location", "address", "map"],
        "business hours": ["hours", "timing", "open", "schedule"],
        "sticky mobile footer": ["fixed", "bottom", "mobile", "sticky"],
        "booking/cta section": ["book", "schedule", "calendly", "apply"],
        "footer": ["footer", "</footer>"]
    }
    
    found = []
    missing = []
    
    for section in mandatory:
        keywords = keyword_map.get(section, [section.split()[0]])
        if any(kw in html_lower for kw in keywords):
            found.append(section)
        else:
            missing.append(section)
    
    return {
        "valid": len(missing) == 0,
        "missing_sections": missing,
        "found_sections": found,
        "suggestions": f"Missing: {', '.join(missing)}" if missing else "All sections present"
    }


def generate_repair_prompt(missing_sections: List[str], market: str) -> str:
    """
    Generate a repair prompt to add missing sections.
    
    Args:
        missing_sections: List of missing section names
        market: Market segment
    
    Returns:
        Repair instruction prompt
    """
    sections_list = "\n".join([f"- {s}" for s in missing_sections])
    
    return f"""
CRITICAL: The generated website is MISSING the following required sections:

{sections_list}

You MUST add these sections to the HTML. Here are the requirements:

{_get_section_requirements(missing_sections, market)}

Re-generate the complete HTML with ALL sections included.
"""


def _get_section_requirements(missing_sections: List[str], market: str) -> str:
    """Get specific requirements for missing sections."""
    requirements = []
    
    for section in missing_sections:
        if "navbar" in section.lower():
            requirements.append("- NAVBAR: Sticky header with logo, navigation links, and CTA button")
        elif "hero" in section.lower():
            if market == "IN":
                requirements.append("- HERO: Large section with headline mentioning location, tagline, and WhatsApp CTA button")
            else:
                requirements.append("- HERO: Authority-style with outcome headline, problem/solution subheadline, and booking CTA")
        elif "service" in section.lower():
            requirements.append("- SERVICES: Grid of 3-6 service cards with icons/titles/descriptions")
        elif "about" in section.lower() or "credibility" in section.lower():
            requirements.append("- ABOUT: Story section with business/personal background and trust elements")
        elif "testimonial" in section.lower() or "social proof" in section.lower():
            requirements.append("- TESTIMONIALS: 2-3 customer review cards with star ratings")
        elif "contact" in section.lower() or "location" in section.lower():
            requirements.append("- CONTACT: Address, phone, map embed placeholder, contact form")
        elif "hours" in section.lower():
            requirements.append("- HOURS: Business operating hours in a clear table/list format")
        elif "sticky mobile" in section.lower():
            requirements.append("- STICKY MOBILE FOOTER: Fixed bottom bar (mobile only) with Call and WhatsApp buttons")
        elif "booking" in section.lower() or "cta" in section.lower():
            requirements.append("- BOOKING CTA: Prominent section with booking button linking to calendar")
        elif "footer" in section.lower():
            requirements.append("- FOOTER: Contact info, quick links, copyright, 'Powered by VocoWeb'")
    
    return "\n".join(requirements)
