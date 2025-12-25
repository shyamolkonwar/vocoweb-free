"""
Website Builder Module
Generates static HTML/CSS websites from business profile and layout.
"""

from typing import Optional
from ..ai.business_parser import BusinessProfile
from ..ai.layout_selector import LayoutBlueprint


def build_website(
    business: BusinessProfile,
    layout: LayoutBlueprint,
    language: str = "en"
) -> str:
    """
    Generate complete HTML website from business profile and layout.
    
    Args:
        business: Structured business information
        layout: Layout configuration
        language: Output language ('en' or 'hi')
    
    Returns:
        Complete HTML string for the website
    """
    is_hindi = language == "hi"
    
    # Localized labels
    labels = {
        "services": "हमारी सेवाएं" if is_hindi else "Our Services",
        "about": "हमारे बारे में" if is_hindi else "About Us",
        "contact": "संपर्क करें" if is_hindi else "Contact Us",
        "location": "स्थान" if is_hindi else "Location",
        "phone": "फोन" if is_hindi else "Phone",
        "hours": "समय" if is_hindi else "Hours",
        "open_hours": "सोमवार - शनिवार: सुबह 9 बजे - रात 8 बजे" if is_hindi else "Monday - Saturday: 9 AM - 8 PM",
        "follow": "हमें फॉलो करें" if is_hindi else "Follow Us",
        "powered_by": "Powered by Setu" if is_hindi else "Powered by Setu"
    }
    
    # Build services HTML
    services_html = "\n".join([
        f'''<div class="service-card">
            <div class="service-icon">✓</div>
            <h3>{service}</h3>
        </div>'''
        for service in business.services
    ])
    
    # Build complete HTML
    html = f'''<!DOCTYPE html>
<html lang="{language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{business.description[:160]}">
    <title>{business.business_name} | {business.business_type}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #fafafa;
        }}
        
        /* Hero Section */
        .hero {{
            background: linear-gradient(135deg, {layout.primary_color} 0%, {layout.primary_color}dd 100%);
            color: white;
            padding: 100px 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        
        .hero::before {{
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 15s infinite;
        }}
        
        @keyframes pulse {{
            0%, 100% {{ transform: scale(1); opacity: 0.5; }}
            50% {{ transform: scale(1.1); opacity: 0.3; }}
        }}
        
        .hero-content {{
            position: relative;
            z-index: 1;
            max-width: 800px;
            margin: 0 auto;
        }}
        
        .hero h1 {{
            font-size: clamp(2rem, 6vw, 3rem);
            font-weight: 700;
            margin-bottom: 16px;
            letter-spacing: -0.02em;
        }}
        
        .hero .tagline {{
            font-size: 1.25rem;
            opacity: 0.9;
            margin-bottom: 12px;
            font-weight: 500;
        }}
        
        .hero .description {{
            font-size: 1rem;
            opacity: 0.8;
            max-width: 600px;
            margin: 0 auto 24px;
        }}
        
        .hero .location {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 0.875rem;
            opacity: 0.7;
            margin-bottom: 32px;
        }}
        
        .cta-btn {{
            display: inline-block;
            background: {layout.accent_color};
            color: white;
            padding: 18px 40px;
            font-size: 1.125rem;
            font-weight: 600;
            border-radius: 12px;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }}
        
        .cta-btn:hover {{
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }}

        /* Section Base */
        section {{
            padding: 80px 20px;
        }}
        
        .container {{
            max-width: 1100px;
            margin: 0 auto;
        }}
        
        .section-title {{
            text-align: center;
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 50px;
            color: {layout.primary_color};
            position: relative;
        }}
        
        .section-title::after {{
            content: '';
            display: block;
            width: 60px;
            height: 4px;
            background: {layout.accent_color};
            margin: 16px auto 0;
            border-radius: 2px;
        }}
        
        /* Services Section */
        .services {{
            background: white;
        }}
        
        .services-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 24px;
        }}
        
        .service-card {{
            background: #f9fafb;
            padding: 32px 24px;
            border-radius: 16px;
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid transparent;
        }}
        
        .service-card:hover {{
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            border-color: {layout.primary_color}33;
        }}
        
        .service-icon {{
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, {layout.primary_color}, {layout.primary_color}cc);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            margin: 0 auto 20px;
        }}
        
        .service-card h3 {{
            font-size: 1rem;
            font-weight: 600;
            color: #1f2937;
        }}

        /* About Section */
        .about {{
            background: linear-gradient(180deg, #f9fafb 0%, white 100%);
        }}
        
        .about-content {{
            text-align: center;
            max-width: 700px;
            margin: 0 auto;
        }}
        
        .about-content p {{
            color: #6b7280;
            font-size: 1.125rem;
            line-height: 1.8;
        }}

        /* Contact Section */
        .contact {{
            background: white;
        }}
        
        .contact-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 40px;
            text-align: center;
        }}
        
        .contact-item {{
            padding: 24px;
        }}
        
        .contact-item h3 {{
            font-size: 0.75rem;
            color: #9ca3af;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }}
        
        .contact-item p {{
            font-size: 1.125rem;
            font-weight: 500;
            color: #1f2937;
        }}

        /* Footer */
        footer {{
            background: #1f2937;
            color: white;
            padding: 40px 20px;
            text-align: center;
        }}
        
        .footer-brand {{
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 12px;
        }}
        
        footer p {{
            opacity: 0.6;
            font-size: 0.875rem;
        }}
        
        /* Mobile Responsive */
        @media (max-width: 640px) {{
            .hero {{
                padding: 60px 20px;
            }}
            
            .hero h1 {{
                font-size: 1.75rem;
            }}
            
            section {{
                padding: 50px 20px;
            }}
            
            .cta-btn {{
                padding: 14px 28px;
                font-size: 1rem;
            }}
        }}
    </style>
</head>
<body>
    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-content">
            <h1>{business.business_name}</h1>
            <p class="tagline">{business.tagline}</p>
            <p class="description">{business.description}</p>
            <div class="location">📍 {business.location}</div>
            <a href="#contact" class="cta-btn">{business.cta}</a>
        </div>
    </section>

    <!-- Services Section -->
    <section class="services">
        <div class="container">
            <h2 class="section-title">{labels["services"]}</h2>
            <div class="services-grid">
                {services_html}
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section class="about">
        <div class="container">
            <h2 class="section-title">{labels["about"]}</h2>
            <div class="about-content">
                <p>{business.description}</p>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section class="contact" id="contact">
        <div class="container">
            <h2 class="section-title">{labels["contact"]}</h2>
            <div class="contact-grid">
                <div class="contact-item">
                    <h3>{labels["location"]}</h3>
                    <p>{business.location}</p>
                </div>
                <div class="contact-item">
                    <h3>{labels["phone"]}</h3>
                    <p>+91 XXXXX XXXXX</p>
                </div>
                <div class="contact-item">
                    <h3>{labels["hours"]}</h3>
                    <p>{labels["open_hours"]}</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="footer-brand">{business.business_name}</div>
        <p>© 2024 {business.business_name}. {labels["powered_by"]}</p>
    </footer>
</body>
</html>'''
    
    return html
