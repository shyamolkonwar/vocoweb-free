"""
Upstash Redis Rate Limiting Utility
Serverless rate limiting for API protection and abuse control.
Supports dynamic rate limits from Supabase in production mode.
"""

import time
import asyncio
from typing import Tuple, Optional, Dict
from upstash_redis import Redis

from app.core.config import get_settings


class UpstashRateLimiter:
    """
    Serverless rate limiter using Upstash Redis.
    
    Features:
    - Distributed rate limiting across all instances
    - Automatic TTL expiration (no cleanup needed)
    - Action-based limits (different limits per action type)
    - Dynamic limits from Supabase in production mode
    - Abuse signal tracking
    """
    
    # Default rate limit configurations (used in development mode)
    DEFAULT_RATE_LIMITS = {
        "api": {"limit": 60, "window": 60},           # 60 requests per minute
        "generate": {"limit": 5, "window": 3600},     # 5 per hour (increased for testing)
        "voice": {"limit": 10, "window": 3600},       # 10 per hour
        "redesign": {"limit": 3, "window": 86400},    # 3 per day
        "publish": {"limit": 20, "window": 3600},     # 20 per hour
        "edit": {"limit": 30, "window": 3600},        # 30 per hour
    }
    
    def __init__(self):
        settings = get_settings()
        self._redis: Optional[Redis] = None
        self._url = settings.upstash_redis_rest_url
        self._token = settings.upstash_redis_rest_token
        self._is_production = settings.is_production
        
        # Cache for dynamic rate limits
        self._dynamic_limits: Optional[Dict] = None
        self._limits_fetched_at: float = 0
        self._cache_ttl = 300  # Cache limits for 5 minutes
    
    @property
    def RATE_LIMITS(self) -> Dict:
        """Get rate limits (from cache/Supabase in production, defaults in development)."""
        if not self._is_production:
            return self.DEFAULT_RATE_LIMITS
        
        # Check if cached limits are still valid
        if self._dynamic_limits and (time.time() - self._limits_fetched_at) < self._cache_ttl:
            return self._dynamic_limits
        
        # Return defaults if not fetched yet (async fetch happens separately)
        return self._dynamic_limits or self.DEFAULT_RATE_LIMITS
    
    async def refresh_limits_from_supabase(self):
        """Fetch rate limits from Supabase and cache them."""
        if not self._is_production:
            return
        
        try:
            from app.services.supabase import supabase_service
            limits = await supabase_service.get_rate_limits()
            
            if limits:
                self._dynamic_limits = limits
                self._limits_fetched_at = time.time()
                print(f"Rate limits refreshed from Supabase: {limits}")
        except Exception as e:
            print(f"Failed to refresh rate limits: {e}")
    
    @property
    def redis(self) -> Optional[Redis]:
        """Get or create Upstash Redis client."""
        if self._redis is None and self.is_configured():
            self._redis = Redis(
                url=self._url,
                token=self._token,
            )
        return self._redis
    
    def is_configured(self) -> bool:
        """Check if Upstash Redis is properly configured."""
        return bool(
            self._url and 
            self._token and
            self._url != "" and
            self._token != ""
        )
    
    def is_rate_limited(
        self, 
        key: str, 
        limit: int, 
        window_seconds: int
    ) -> Tuple[bool, int, int]:
        """
        Check if a request is rate limited.
        
        Args:
            key: Unique identifier (e.g., "user:{user_id}:generate")
            limit: Maximum requests allowed in window
            window_seconds: Time window in seconds
        
        Returns:
            Tuple of (is_limited, current_count, remaining)
        """
        if not self.is_configured():
            # SECURITY: Fail closed if not configured
            print("[RateLimit] Not configured - denying request")
            return True, 0, 0
        
        try:
            now = int(time.time())
            window_key = f"ratelimit:{key}:{now // window_seconds}"
            
            # Increment counter
            count = self.redis.incr(window_key)
            
            # Set expiry on first request in window
            if count == 1:
                self.redis.expire(window_key, window_seconds)
            
            is_limited = count > limit
            remaining = max(0, limit - count)
            
            return is_limited, count, remaining
            
        except Exception as e:
            print(f"Upstash rate limit error: {e}")
            # SECURITY: Fail closed on error - deny request
            return True, 0, 0
    
    def check_action_limit(
        self, 
        user_id: str, 
        action: str
    ) -> Tuple[bool, str, int]:
        """
        Check rate limit for a specific action type.
        
        Args:
            user_id: The user's ID
            action: Action type (generate, voice, redesign, publish, edit)
        
        Returns:
            Tuple of (is_allowed, message, remaining)
        """
        config = self.RATE_LIMITS.get(action, self.RATE_LIMITS["api"])
        limit = config["limit"]
        window = config["window"]
        
        key = f"user:{user_id}:{action}"
        is_limited, count, remaining = self.is_rate_limited(key, limit, window)
        
        if is_limited:
            # Calculate retry time
            window_name = self._format_window(window)
            message = f"Rate limit exceeded for {action}. Try again in {window_name}."
            return False, message, 0
        
        return True, "OK", remaining
    
    def _format_window(self, seconds: int) -> str:
        """Format window seconds to human-readable string."""
        if seconds >= 86400:
            return f"{seconds // 86400} day(s)"
        elif seconds >= 3600:
            return f"{seconds // 3600} hour(s)"
        elif seconds >= 60:
            return f"{seconds // 60} minute(s)"
        return f"{seconds} second(s)"
    
    def track_abuse_signal(
        self, 
        user_id: str, 
        signal: str, 
        ttl_seconds: int = 3600
    ) -> int:
        """
        Track an abuse signal for a user.
        
        Args:
            user_id: The user's ID
            signal: Signal type (e.g., "failed_jobs", "rapid_requests")
            ttl_seconds: Time to live for the counter
        
        Returns:
            Current count of the signal
        """
        if not self.is_configured():
            return 0
        
        try:
            key = f"abuse:{user_id}:{signal}"
            count = self.redis.incr(key)
            
            if count == 1:
                self.redis.expire(key, ttl_seconds)
            
            return count
            
        except Exception as e:
            print(f"Upstash abuse tracking error: {e}")
            return 0
    
    def get_abuse_score(self, user_id: str) -> int:
        """
        Get the abuse score for a user.
        
        Returns:
            Sum of all abuse signals for the user
        """
        if not self.is_configured():
            return 0
        
        try:
            signals = ["failed_jobs", "rapid_requests", "limit_violations"]
            total = 0
            
            for signal in signals:
                key = f"abuse:{user_id}:{signal}"
                count = self.redis.get(key)
                if count:
                    total += int(count)
            
            return total
            
        except Exception as e:
            print(f"Upstash abuse score error: {e}")
            return 0
    
    def is_user_blocked(self, user_id: str, threshold: int = 10) -> bool:
        """
        Check if a user should be temporarily blocked based on abuse score.
        
        Args:
            user_id: The user's ID
            threshold: Abuse score threshold for blocking
        
        Returns:
            True if user should be blocked
        """
        return self.get_abuse_score(user_id) >= threshold


# Global instance
upstash_rate_limiter = UpstashRateLimiter()


def check_rate_limit(user_id: str, action: str) -> Tuple[bool, str, int]:
    """
    Convenience function to check rate limits.
    
    Args:
        user_id: The user's ID
        action: Action type
    
    Returns:
        Tuple of (is_allowed, message, remaining)
    """
    return upstash_rate_limiter.check_action_limit(user_id, action)


def check_ip_rate_limit(ip: str, action: str) -> Tuple[bool, str, int]:
    """
    Check rate limit for an IP address on unauthenticated endpoints.
    SECURITY: VULN-M01 fix - IP-based rate limiting for public endpoints.
    
    Args:
        ip: Client IP address
        action: Action type (e.g., 'lead_submit', 'waitlist')
    
    Returns:
        Tuple of (is_allowed, message, remaining)
    """
    # Use lower limits for IP-based rate limiting
    IP_RATE_LIMITS = {
        "lead_submit": {"limit": 10, "window": 3600},     # 10 per hour per IP
        "waitlist": {"limit": 5, "window": 3600},         # 5 per hour per IP
        "public_api": {"limit": 30, "window": 60},        # 30 per minute per IP
    }
    
    config = IP_RATE_LIMITS.get(action, IP_RATE_LIMITS["public_api"])
    limit = config["limit"]
    window = config["window"]
    
    key = f"ip:{ip}:{action}"
    is_limited, count, remaining = upstash_rate_limiter.is_rate_limited(key, limit, window)
    
    if is_limited:
        window_name = upstash_rate_limiter._format_window(window)
        return False, f"Too many requests. Try again in {window_name}.", 0
    
    return True, "OK", remaining
