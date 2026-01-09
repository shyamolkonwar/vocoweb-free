"""
Configuration management for the backend.
Loads environment variables securely.
"""

import os
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application Mode: 'development' or 'production'
    # development = local storage, no Cloudflare publishing
    # production = Supabase storage, Cloudflare publishing, credit tracking
    app_mode: str = "development"
    
    # OpenAI
    openai_api_key: str = ""
    
    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False  # SECURITY: Default to False for production
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.app_mode.lower() == "production"
    
    def validate_production_config(self) -> None:
        """SECURITY: Validate required config is set in production mode."""
        if self.is_production:
            if not self.supabase_service_key:
                raise ValueError("SUPABASE_SERVICE_KEY is required in production mode")
            if not self.supabase_url:
                raise ValueError("SUPABASE_URL is required in production mode")
            if not self.openai_api_key:
                raise ValueError("OPENAI_API_KEY is required in production mode")
    
    # CORS origins - SECURITY: No wildcards, explicit origins only
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Rate limiting
    rate_limit_requests: int = 5
    rate_limit_window_seconds: int = 3600  # 1 hour
    
    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"
    redis_backend_url: str = "redis://localhost:6379/1"
    
    # Upstash Redis (Rate Limiting & Abuse Control)
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""
    
    # Cloudflare Configuration
    cloudflare_account_id: str = ""
    cloudflare_api_token: str = ""
    cloudflare_pages_project: str = ""
    
    # Cloudflare R2 Storage
    cloudflare_r2_access_key: str = ""
    cloudflare_r2_secret_key: str = ""
    cloudflare_r2_bucket: str = ""
    cloudflare_r2_endpoint: str = ""
    
    # Base domain for published sites
    base_domain: str = "vocoweb.local"
    
    # Pexels API (Free stock photos)
    pexels_api_key: str = ""
    
    class Config:
        env_file = Path(__file__).parent.parent.parent / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
