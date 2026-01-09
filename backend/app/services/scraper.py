"""
Web Scraper Module
Extracts content from existing websites for redesign feature.
"""

import re
from typing import Optional
from urllib.parse import urljoin, urlparse
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup


class ScrapedContent(BaseModel):
    """Structured content extracted from a website."""
    url: str
    title: str
    description: str
    headings: list[str]
    paragraphs: list[str]
    contact: dict  # phone, email, address
    images: list[str]
    services: list[str]
    links: list[str]
    raw_text: str


class ScrapeError(Exception):
    """Custom exception for scraping errors."""
    pass


async def scrape_website(url: str, timeout: float = 10.0) -> ScrapedContent:
    """
    Scrape content from a website URL.
    
    Args:
        url: Website URL to scrape
        timeout: Request timeout in seconds
    
    Returns:
        ScrapedContent with extracted information
    
    Raises:
        ScrapeError: If scraping fails
    """
    # Validate URL
    parsed = urlparse(url)
    if not parsed.scheme:
        url = f"https://{url}"
        parsed = urlparse(url)
    
    if parsed.scheme not in ("http", "https"):
        raise ScrapeError("Invalid URL scheme. Use http or https.")
    
    if not parsed.netloc:
        raise ScrapeError("Invalid URL. Please provide a valid website address.")
    
    # Fetch page
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; SetuBot/1.0; +https://setu.in)"
            }
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
    except httpx.TimeoutException:
        raise ScrapeError("Website took too long to respond. Please try again.")
    except httpx.HTTPStatusError as e:
        raise ScrapeError(f"Could not access website: HTTP {e.response.status_code}")
    except httpx.RequestError as e:
        raise ScrapeError(f"Could not connect to website: {str(e)}")
    
    # Parse HTML
    try:
        soup = BeautifulSoup(response.text, "lxml")
    except Exception:
        soup = BeautifulSoup(response.text, "html.parser")
    
    # Remove script and style elements
    for element in soup(["script", "style", "nav", "header", "footer", "aside"]):
        element.decompose()
    
    # Extract title
    title = ""
    if soup.title:
        title = soup.title.string or ""
    if not title:
        h1 = soup.find("h1")
        title = h1.get_text(strip=True) if h1 else ""
    
    # Extract meta description
    description = ""
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc:
        description = meta_desc.get("content", "")
    
    # Extract headings
    headings = []
    for tag in ["h1", "h2", "h3"]:
        for heading in soup.find_all(tag):
            text = heading.get_text(strip=True)
            if text and len(text) > 3:
                headings.append(text)
    
    # Extract paragraphs
    paragraphs = []
    for p in soup.find_all("p"):
        text = p.get_text(strip=True)
        if text and len(text) > 20:
            paragraphs.append(text)
    
    # Extract contact info
    contact = _extract_contact_info(soup, response.text)
    
    # Extract images
    images = []
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src")
        if src:
            # Make absolute URL
            abs_url = urljoin(url, src)
            if not abs_url.startswith("data:"):
                images.append(abs_url)
    
    # Extract services/products (common patterns)
    services = _extract_services(soup)
    
    # Extract links
    links = []
    for a in soup.find_all("a", href=True):
        href = a.get("href")
        text = a.get_text(strip=True)
        if href and text and not href.startswith("#"):
            links.append(text)
    
    # Get full text
    raw_text = soup.get_text(separator=" ", strip=True)
    # Clean up whitespace
    raw_text = re.sub(r'\s+', ' ', raw_text)[:5000]  # Limit to 5000 chars
    
    return ScrapedContent(
        url=url,
        title=title[:200],
        description=description[:500],
        headings=headings[:20],
        paragraphs=paragraphs[:20],
        contact=contact,
        images=images[:10],
        services=services[:10],
        links=links[:20],
        raw_text=raw_text
    )


def _extract_contact_info(soup: BeautifulSoup, html: str) -> dict:
    """Extract phone, email, and address from page."""
    contact = {
        "phone": None,
        "email": None,
        "address": None
    }
    
    # Email pattern
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, html)
    if emails:
        contact["email"] = emails[0]
    
    # Phone patterns (Indian and international)
    phone_patterns = [
        r'\+91[\s-]?\d{5}[\s-]?\d{5}',
        r'\+91[\s-]?\d{10}',
        r'\d{5}[\s-]?\d{5}',
        r'\d{3}[\s-]?\d{3}[\s-]?\d{4}',
    ]
    for pattern in phone_patterns:
        phones = re.findall(pattern, html)
        if phones:
            contact["phone"] = phones[0]
            break
    
    # Address (look in common containers)
    address_containers = soup.find_all(
        ["address", "div", "p"],
        class_=lambda x: x and ("address" in str(x).lower() or "contact" in str(x).lower())
    )
    for container in address_containers:
        text = container.get_text(strip=True)
        if len(text) > 20 and len(text) < 200:
            contact["address"] = text
            break
    
    return contact


def _extract_services(soup: BeautifulSoup) -> list[str]:
    """Extract services or product names from page."""
    services = []
    
    # Look for service-like containers
    service_indicators = ["service", "product", "offering", "feature", "benefit"]
    
    for indicator in service_indicators:
        containers = soup.find_all(
            ["div", "section", "ul"],
            class_=lambda x: x and indicator in str(x).lower()
        )
        for container in containers:
            # Get list items or headings
            items = container.find_all(["li", "h3", "h4"])
            for item in items:
                text = item.get_text(strip=True)
                if text and 3 < len(text) < 100:
                    services.append(text)
    
    # Fallback: look for bullet points
    if not services:
        for ul in soup.find_all("ul"):
            for li in ul.find_all("li"):
                text = li.get_text(strip=True)
                if text and 5 < len(text) < 80:
                    services.append(text)
    
    return list(set(services))[:10]


def validate_url(url: str) -> tuple[bool, str]:
    """
    Validate if URL is scrapable.
    
    Returns:
        (is_valid, normalized_url or error_message)
    """
    if not url:
        return False, "Please provide a URL"
    
    # Add scheme if missing
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    
    parsed = urlparse(url)
    
    if not parsed.netloc:
        return False, "Invalid URL format"
    
    # SECURITY: Proper SSRF protection with IP validation
    import socket
    import ipaddress
    
    hostname = parsed.netloc.split(':')[0]  # Remove port if present
    
    # Block obvious private hostnames first
    blocked_hosts = ["localhost", "metadata.google.internal", "instance-data"]
    if hostname.lower() in blocked_hosts:
        return False, "Cannot scrape private addresses"
    
    try:
        # Resolve hostname to IP to catch DNS rebinding attacks
        ip_str = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip_str)
        
        # Block private IPs (10.x, 172.16-31.x, 192.168.x)
        if ip_obj.is_private:
            return False, "Cannot scrape private IP addresses"
        
        # Block loopback (127.0.0.0/8, ::1)
        if ip_obj.is_loopback:
            return False, "Cannot scrape localhost"
        
        # Block link-local (169.254.x.x) - includes cloud metadata!
        if ip_obj.is_link_local:
            return False, "Cannot scrape link-local addresses"
        
        # Block reserved ranges
        if ip_obj.is_reserved:
            return False, "Cannot scrape reserved addresses"
        
        # Explicitly block AWS/GCP/Azure metadata endpoint
        if ip_str == "169.254.169.254":
            return False, "Cannot scrape cloud metadata endpoints"
        
    except socket.gaierror:
        return False, "Could not resolve hostname"
    except ValueError:
        return False, "Invalid IP address"
    
    return True, url
