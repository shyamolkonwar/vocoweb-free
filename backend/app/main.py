"""
FastAPI Backend for AI Website Builder Platform
Setu - AI Website Operator for Local Businesses
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.api.routes import waitlist, generate, generate_code, publish, sites, voice, edit, redesign, tasks, auth, usage, websites, leads, upload
from app.core.config import get_settings
from app.core.rate_limiter import rate_limit_middleware

settings = get_settings()

# SECURITY: VULN-10 fix - Validate production config on startup
settings.validate_production_config()

# SECURITY: Disable docs in production
docs_url = "/docs" if not settings.is_production else None
redoc_url = "/redoc" if not settings.is_production else None

app = FastAPI(
    title="Setu API",
    description="AI Website Builder for Local Businesses - Build professional websites using voice or text. Powered by Supabase and Cloudflare.",
    version="1.0.0",
    docs_url=docs_url,
    redoc_url=redoc_url
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  # SECURITY: Explicit methods
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],  # SECURITY: Explicit headers
)


# SECURITY: Add security headers middleware
@app.middleware("http")
async def security_headers_middleware(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Rate limiting middleware
app.middleware("http")(rate_limit_middleware)

# Include routers - LOW-003: API versioning with /v1/ prefix
app.include_router(waitlist.router, prefix="/api/v1", tags=["Waitlist"])
app.include_router(generate.router, prefix="/api/v1", tags=["Generate"])
app.include_router(generate_code.router, prefix="/api/v1", tags=["Generate Code"])
app.include_router(publish.router, prefix="/api/v1", tags=["Publish"])
app.include_router(sites.router, prefix="/sites", tags=["Sites"])  # Keep /sites for backward compat
app.include_router(voice.router, prefix="/api/v1", tags=["Voice"])
app.include_router(edit.router, prefix="/api/v1", tags=["Edit"])
app.include_router(redesign.router, prefix="/api/v1", tags=["Redesign"])
app.include_router(tasks.router, prefix="/api/v1", tags=["Tasks"])
app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
app.include_router(usage.router, prefix="/api/v1", tags=["Usage"])
app.include_router(websites.router, prefix="/api/v1", tags=["Websites"])
app.include_router(leads.router, prefix="/api/v1", tags=["Leads"])
app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])

# Backward compatibility: Keep old /api routes for existing clients
app.include_router(waitlist.router, prefix="/api", tags=["Waitlist (Legacy)"], include_in_schema=False)
app.include_router(generate.router, prefix="/api", tags=["Generate (Legacy)"], include_in_schema=False)
app.include_router(publish.router, prefix="/api", tags=["Publish (Legacy)"], include_in_schema=False)
app.include_router(voice.router, prefix="/api", tags=["Voice (Legacy)"], include_in_schema=False)
app.include_router(edit.router, prefix="/api", tags=["Edit (Legacy)"], include_in_schema=False)
app.include_router(redesign.router, prefix="/api", tags=["Redesign (Legacy)"], include_in_schema=False)
app.include_router(tasks.router, prefix="/api", tags=["Tasks (Legacy)"], include_in_schema=False)
app.include_router(auth.router, prefix="/api", tags=["Auth (Legacy)"], include_in_schema=False)
app.include_router(usage.router, prefix="/api", tags=["Usage (Legacy)"], include_in_schema=False)
app.include_router(websites.router, prefix="/api", tags=["Websites (Legacy)"], include_in_schema=False)
app.include_router(leads.router, prefix="/api", tags=["Leads (Legacy)"], include_in_schema=False)
app.include_router(upload.router, prefix="/api", tags=["Upload (Legacy)"], include_in_schema=False)


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "name": "Setu API",
        "version": "1.0.0",
        "description": "AI Website Builder for Local Businesses",
        "docs": "/docs",
        "status": "running",
        "features": ["generate", "preview", "publish", "voice", "edit", "redesign", "async-tasks", "auth", "rate-limiting", "cloudflare-pages", "supabase-storage"]
    }


@app.get("/health")
async def health_check(request: Request):
    """Health check endpoint with lightweight rate limiting."""
    from app.core.rate_limit import upstash_rate_limiter
    
    # LOW-005: Lightweight rate limit for health endpoint (100 req/min per IP)
    client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if not client_ip and request.client:
        client_ip = request.client.host
    
    if upstash_rate_limiter.is_configured():
        is_limited, _, _ = upstash_rate_limiter.is_rate_limited(
            f"health:{client_ip}", limit=100, window_seconds=60
        )
        if is_limited:
            return {"status": "rate_limited", "retry_after": 60}
    
    return {
        "status": "healthy",
        "openai_configured": bool(settings.openai_api_key)
    }
