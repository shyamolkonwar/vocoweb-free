"""
Security Logging Module
Low-impact structured logging that filters sensitive data.
"""

import logging
import re
from typing import Any

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# Create security logger
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)

# Patterns to redact from logs
SENSITIVE_PATTERNS = [
    (r'"password"\s*:\s*"[^"]*"', '"password": "[REDACTED]"'),
    (r'"token"\s*:\s*"[^"]*"', '"token": "[REDACTED]"'),
    (r'"api_key"\s*:\s*"[^"]*"', '"api_key": "[REDACTED]"'),
    (r'"access_token"\s*:\s*"[^"]*"', '"access_token": "[REDACTED]"'),
    (r'"refresh_token"\s*:\s*"[^"]*"', '"refresh_token": "[REDACTED]"'),
    (r'"secret"\s*:\s*"[^"]*"', '"secret": "[REDACTED]"'),
    (r'"authorization"\s*:\s*"[^"]*"', '"authorization": "[REDACTED]"'),
    (r'Bearer\s+[A-Za-z0-9\-_\.]+', 'Bearer [REDACTED]'),
    (r'"email"\s*:\s*"([^@]+)@', '"email": "[REDACTED]@'),
    (r'"phone"\s*:\s*"[^"]*"', '"phone": "[REDACTED]"'),
]


def sanitize_log_message(message: str) -> str:
    """Remove sensitive data from log messages."""
    sanitized = message
    for pattern, replacement in SENSITIVE_PATTERNS:
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
    return sanitized


def log_security_event(event_type: str, message: str, user_id: str = None, extra: dict = None):
    """
    Log a security-relevant event with sanitized data.
    
    Args:
        event_type: Type of security event (auth, access, rate_limit, etc.)
        message: Event message
        user_id: Optional user ID
        extra: Optional additional context
    """
    sanitized_message = sanitize_log_message(message)
    log_data = {
        "event_type": event_type,
        "user_id": user_id[:8] + "..." if user_id and len(user_id) > 8 else user_id,
    }
    if extra:
        sanitized_extra = {k: sanitize_log_message(str(v)) for k, v in extra.items()}
        log_data.update(sanitized_extra)
    
    security_logger.info(f"[{event_type}] {sanitized_message} | {log_data}")


def log_auth_failure(reason: str, ip_address: str = None):
    """Log authentication failure for monitoring."""
    log_security_event("auth_failure", reason, extra={"ip": ip_address})


def log_rate_limit_hit(user_id: str, action: str):
    """Log rate limit enforcement."""
    log_security_event("rate_limit", f"Rate limit hit for {action}", user_id=user_id)


def log_access_denied(resource: str, user_id: str = None):
    """Log unauthorized access attempt."""
    log_security_event("access_denied", f"Access denied to {resource}", user_id=user_id)
