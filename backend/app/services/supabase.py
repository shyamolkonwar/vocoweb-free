"""
Supabase Service Module
Handles all Supabase database operations with proper error handling.
"""

import os
from typing import Optional, Dict, Any, List
from datetime import datetime
from supabase import create_client, Client
from app.core.config import get_settings


class SupabaseService:
    """Service for interacting with Supabase database."""
    
    def __init__(self):
        settings = get_settings()
        self.url = settings.supabase_url
        self.key = settings.supabase_service_key
        self._client: Optional[Client] = None
    
    @property
    def client(self) -> Client:
        """Get or create Supabase client."""
        if not self._client:
            if not self.url or not self.key:
                raise ValueError("Supabase credentials not configured")
            self._client = create_client(self.url, self.key)
        return self._client
    
    def is_configured(self) -> bool:
        """Check if Supabase is properly configured."""
        return bool(self.url and self.key and 
                   self.url != "https://your-project.supabase.co" and
                   self.key != "your-service-role-key-here")
    
    async def add_waitlist_entry(
        self,
        contact: str,
        contact_type: str,
        business_description: Optional[str] = None,
        language: str = "en",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Add a new waitlist entry to Supabase.
        
        Args:
            contact: Email or WhatsApp number
            contact_type: 'email' or 'whatsapp'
            business_description: Optional business description
            language: Language preference
            ip_address: User's IP address
            user_agent: User's browser user agent
        
        Returns:
            Created waitlist entry
        """
        if not self.is_configured():
            raise ValueError("Supabase not configured")
        
        data = {
            "contact": contact,
            "contact_type": contact_type,
            "business_description": business_description,
            "language": language,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "created_at": datetime.utcnow().isoformat()
        }
        
        response = self.client.table("waitlist").insert(data).execute()
        
        if response.data:
            return response.data[0]
        else:
            raise Exception("Failed to insert waitlist entry")
    
    async def check_duplicate(self, contact: str) -> bool:
        """
        Check if contact already exists in waitlist.
        
        Args:
            contact: Email or WhatsApp number
        
        Returns:
            True if duplicate exists
        """
        if not self.is_configured():
            return False
        
        response = self.client.table("waitlist")\
            .select("id")\
            .eq("contact", contact)\
            .execute()
        
        return len(response.data) > 0
    
    async def get_waitlist_count(self) -> int:
        """Get total number of waitlist entries."""
        if not self.is_configured():
            return 0
        
        response = self.client.table("waitlist")\
            .select("id", count="exact")\
            .execute()
        
        return response.count or 0


# Global instance
supabase_service = SupabaseService()
