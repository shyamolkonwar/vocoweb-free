"""
Authentication Middleware
Verifies Supabase JWTs using JWKS for protected routes.
Supports ES256 (ECC), RS256, and HS256 algorithms.
"""

import os
import requests
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer
from fastapi.security.utils import get_authorization_scheme_param
from pydantic import BaseModel
from jose import jwt, JWTError
from functools import lru_cache

from app.core.config import get_settings


# JWT Bearer token scheme (for Swagger UI)
security = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    """Authenticated user from JWT token."""
    id: str
    email: str
    role: str = "authenticated"
    
    @property
    def user_id(self) -> str:
        """Alias for id for compatibility."""
        return self.id


@lru_cache(maxsize=1)
def get_jwks():
    """Fetch and cache JWKS from Supabase."""
    settings = get_settings()
    supabase_url = settings.supabase_url
    
    if not supabase_url:
        print("Auth middleware: Supabase URL not configured")
        return None
    
    try:
        project_id = supabase_url.replace("https://", "").split(".")[0]
        jwks_url = f"https://{project_id}.supabase.co/auth/v1/.well-known/jwks.json"
        response = requests.get(jwks_url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Auth middleware: Failed to fetch JWKS: {e}")
        return None


def verify_jwt(token: str) -> AuthUser:
    """
    Verify a Supabase JWT token.
    Tries ES256 (ECC), RS256, and HS256 algorithms.
    """
    settings = get_settings()
    errors = []
    
    # Early validation: JWT must have 3 segments separated by dots
    if not token or token.count('.') != 2:
        print(f"Auth middleware: Invalid token format (segments: {token.count('.') if token else 0})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )
    
    # Clean the token (remove any whitespace)
    token = token.strip()
    
    # Try JWKS verification first (supports ES256/RS256)
    jwks = get_jwks()
    if jwks:
        # Try ES256 first (Supabase's new default with ECC keys)
        for alg in ["ES256", "RS256"]:
            try:
                payload = jwt.decode(
                    token,
                    jwks,
                    algorithms=[alg],
                    audience="authenticated"
                )
                print(f"Auth middleware: Verified token with {alg}")
                return AuthUser(
                    id=payload["sub"],
                    email=payload.get("email", ""),
                    role=payload.get("role", "authenticated")
                )
            except Exception as e:
                errors.append(f"{alg}: {str(e)}")
    
    # Try HS256 with JWT secret as fallback (DISABLED in production for security)
    # SECURITY: HS256 with shared secret is less secure than RS256/ES256
    jwt_secret = getattr(settings, "supabase_jwt_secret", None) or os.getenv("SUPABASE_JWT_SECRET")
    is_production = getattr(settings, "is_production", False)
    
    if jwt_secret and not is_production:  # Only allow HS256 in development
        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience="authenticated"
            )
            print("Auth middleware: Verified token with HS256 (dev mode)")
            return AuthUser(
                id=payload["sub"],
                email=payload.get("email", ""),
                role=payload.get("role", "authenticated")
            )
        except Exception as e:
            errors.append(f"HS256: {str(e)}")
    
    # All methods failed - MEDIUM-009: Track auth failures for account lockout
    error_msg = " | ".join(errors) if errors else "No verification methods available"
    print(f"Auth middleware: All verification failed: {error_msg}")
    
    # Track failed auth attempt for potential lockout (abuse detection)
    try:
        from app.core.rate_limit import upstash_rate_limiter
        # Extract partial token ID for tracking (don't store full token)
        partial_id = token[:16] if len(token) > 16 else "unknown"
        upstash_rate_limiter.track_abuse_signal(partial_id, "auth_failures", ttl_seconds=3600)
    except Exception:
        pass  # Don't fail on tracking errors
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication failed"  # Generic message for security
    )


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> Optional[AuthUser]:
    """Get current user if authenticated, None otherwise."""
    if not authorization:
        return None
        
    scheme, param = get_authorization_scheme_param(authorization)
    if scheme.lower() != "bearer":
        return None
        
    try:
        return verify_jwt(param)
    except Exception:
        return None


async def require_auth(
    authorization: Optional[str] = Header(None),
    x_authorization: Optional[str] = Header(None, alias="X-Authorization")
) -> AuthUser:
    """Dependency that requires authentication."""
    auth_header = authorization or x_authorization
    if not auth_header:
        print(f"Auth middleware: No Authorization header (auth={authorization}, x_auth={x_authorization})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    scheme, param = get_authorization_scheme_param(auth_header)
    if scheme.lower() != "bearer":
        print(f"Auth middleware: Invalid scheme '{scheme}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return verify_jwt(param)


async def get_optional_user(
    authorization: Optional[str] = Header(None)
) -> Optional[AuthUser]:
    """Dependency that attempts to authenticate but doesn't require it."""
    return await get_current_user(authorization)
