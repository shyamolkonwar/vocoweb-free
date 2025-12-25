"""
Rate Limiting Module
Simple in-memory rate limiter for API protection.
"""

from datetime import datetime, timedelta
from typing import Dict, Tuple
from collections import defaultdict


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, max_requests: int = 5, window_seconds: int = 3600):
        """
        Initialize rate limiter.
        
        Args:
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, list] = defaultdict(list)
    
    def is_allowed(self, identifier: str) -> Tuple[bool, int]:
        """
        Check if request is allowed for identifier.
        
        Args:
            identifier: Unique identifier (e.g., IP address)
        
        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=self.window_seconds)
        
        # Clean old requests
        self._requests[identifier] = [
            req_time for req_time in self._requests[identifier]
            if req_time > window_start
        ]
        
        # Check if limit exceeded
        current_count = len(self._requests[identifier])
        
        if current_count >= self.max_requests:
            return False, 0
        
        # Add new request
        self._requests[identifier].append(now)
        remaining = self.max_requests - current_count - 1
        
        return True, remaining
    
    def reset(self, identifier: str):
        """Reset rate limit for identifier."""
        if identifier in self._requests:
            del self._requests[identifier]


# Global rate limiter instance
rate_limiter = RateLimiter(max_requests=5, window_seconds=3600)
