"""
Cloudflare Pages Service
Handles deployment of static websites to Cloudflare Pages.
"""

import httpx
import re
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.config import get_settings


class DeploymentResult(BaseModel):
    """Result of a Cloudflare Pages deployment."""
    success: bool
    deployment_id: Optional[str] = None
    subdomain: str
    live_url: str
    message: str
    ssl_status: str = "pending"


class CloudflareService:
    """Service for deploying websites to Cloudflare Pages."""
    
    def __init__(self):
        settings = get_settings()
        self.account_id = settings.cloudflare_account_id
        self.api_token = settings.cloudflare_api_token
        self.pages_project = settings.cloudflare_pages_project
        self.base_domain = settings.base_domain
        self.api_base = "https://api.cloudflare.com/client/v4"
        self._client: Optional[httpx.AsyncClient] = None
    
    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create async HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                headers={
                    "Authorization": f"Bearer {self.api_token}",
                    "Content-Type": "application/json"
                },
                timeout=60.0
            )
        return self._client
    
    def is_configured(self) -> bool:
        """Check if Cloudflare is properly configured."""
        return bool(
            self.account_id and 
            self.api_token and 
            self.pages_project and
            self.account_id != "" and
            self.api_token != ""
        )
    
    def generate_subdomain(self, business_name: str) -> str:
        """
        Generate a URL-friendly subdomain from business name with unique suffix.
        
        Args:
            business_name: The business name to convert
        
        Returns:
            Clean subdomain string with unique suffix
        """
        import uuid
        
        # Convert to lowercase and replace spaces
        subdomain = business_name.lower()
        # Remove special characters
        subdomain = re.sub(r'[^a-z0-9\s-]', '', subdomain)
        # Replace spaces with hyphens
        subdomain = re.sub(r'\s+', '-', subdomain)
        # Remove consecutive hyphens
        subdomain = re.sub(r'-+', '-', subdomain)
        # Trim hyphens from ends
        subdomain = subdomain.strip('-')
        # Limit length to leave room for unique suffix
        subdomain = subdomain[:24]
        
        # Add unique 4-character suffix to prevent duplicates
        unique_suffix = uuid.uuid4().hex[:4]
        subdomain = f"{subdomain}-{unique_suffix}" if subdomain else f"site-{unique_suffix}"
        
        return subdomain
    
    async def deploy_to_pages(
        self, 
        website_id: str, 
        html_content: str, 
        subdomain: str,
        user_id: Optional[str] = None
    ) -> DeploymentResult:
        """
        Deploy a website to Cloudflare Pages using Wrangler CLI.
        
        This uses `npx wrangler pages deploy` to handle the direct upload.
        We deploy to a branch named after the subdomain to get a stable URL:
        https://{subdomain}.{project}.pages.dev
        
        Args:
            website_id: Unique website identifier
            html_content: The HTML content to deploy
            subdomain: The subdomain for the site (used as branch name)
            user_id: Owner user ID
        
        Returns:
            DeploymentResult with deployment status and URL
        """
        import os
        import shutil
        import tempfile
        import asyncio
        from app.core.config import get_settings
        
        settings = get_settings()
        
        if not self.is_configured():
            local_url = f"http://localhost:8000/sites/{subdomain}"
            return DeploymentResult(
                success=True,
                subdomain=subdomain,
                live_url=local_url,
                message="Deployed locally (Cloudflare not configured)",
                ssl_status="n/a"
            )
        
        # Create a temporary directory for the site content
        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                # Write index.html
                site_path = os.path.join(temp_dir, "index.html")
                with open(site_path, "w", encoding="utf-8") as f:
                    f.write(html_content)
                
                # Prepare environment for wrangler
                env = os.environ.copy()
                env["CLOUDFLARE_ACCOUNT_ID"] = self.account_id
                env["CLOUDFLARE_API_TOKEN"] = self.api_token
                
                # Construct wrangler command
                # Deploy to a branch named after the subdomain
                cmd = [
                    "npx", "wrangler", "pages", "deploy", temp_dir,
                    "--project-name", self.pages_project,
                    "--branch", subdomain,
                    "--commit-dirty=true"
                ]
                
                print(f"Executing deployment: {' '.join(cmd)}")
                
                # Run wrangler
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env=env,
                    cwd=os.getcwd() # Run from current dir
                )
                
                stdout, stderr = await process.communicate()
                
                stdout_str = stdout.decode()
                stderr_str = stderr.decode()
                
                print(f"Wrangler output: {stdout_str}")
                if stderr_str:
                    print(f"Wrangler stderr: {stderr_str}")
                
                if process.returncode == 0:
                    # Parse the URL from output or construct it
                    # Wrangler output usually contains the deployment URL
                    # But predictable URL for branch deployment is:
                    # https://{branch}.{project}.pages.dev
                    
                    project_subdomain = self.pages_project
                    live_url = f"https://{subdomain}.{project_subdomain}.pages.dev"
                    
                    # If custom domain is set for valid subdomains, we can try to use it
                    # But typically branches are on .pages.dev
                    if self.base_domain and self.base_domain != "setu.local":
                        # If user configured wildcard DNS/custom domain properly
                        live_url = f"https://{subdomain}.{self.base_domain}"
                    
                    deployment_id = f"cf-{subdomain}-{int(datetime.now().timestamp())}"
                    
                    return DeploymentResult(
                        success=True,
                        deployment_id=deployment_id,
                        subdomain=subdomain,
                        live_url=live_url,
                        message="Website deployed to Cloudflare Pages!",
                        ssl_status="active"
                    )
                else:
                    return DeploymentResult(
                        success=False,
                        subdomain=subdomain,
                        live_url="",
                        message=f"Wrangler failed: {stderr_str}"
                    )
                    
            except Exception as e:
                return DeploymentResult(
                    success=False,
                    subdomain=subdomain,
                    live_url="",
                    message=f"Deployment error: {str(e)}"
                )
    
    async def delete_deployment(self, subdomain: str) -> bool:
        """
        Delete a deployment (not easily supported via API needed for unpublish).
        For Pages, we might just leave old branches or delete the project logic.
        Current wrangler doesn't easily delete deployments/branches via CLI.
        """
        return True
    
    async def get_deployment_status(self, deployment_id: str) -> dict:
        """
        Get the status of a deployment.
        
        Args:
            deployment_id: The Cloudflare deployment ID
        
        Returns:
            Deployment status information
        """
        if not self.is_configured():
            return {"status": "unknown", "message": "Cloudflare not configured"}
        
        try:
            url = f"{self.api_base}/accounts/{self.account_id}/pages/projects/{self.pages_project}/deployments/{deployment_id}"
            
            response = await self.client.get(url)
            
            if response.status_code == 200:
                data = response.json().get("result", {})
                return {
                    "status": data.get("latest_stage", {}).get("status", "unknown"),
                    "url": data.get("url"),
                    "created_at": data.get("created_on"),
                    "ssl_status": "active" if data.get("url", "").startswith("https") else "pending"
                }
            
            return {"status": "error", "message": "Failed to get deployment status"}
            
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def deploy_multipage_to_pages(
        self, 
        website_id: str, 
        pages: dict,  # Dict[str, str] mapping filename to HTML content
        subdomain: str,
        user_id: Optional[str] = None
    ) -> DeploymentResult:
        """
        Deploy a multi-page website to Cloudflare Pages.
        
        Args:
            website_id: Unique website identifier
            pages: Dict mapping filenames (e.g. 'index.html', 'about.html') to HTML content
            subdomain: The subdomain for the site (used as branch name)
            user_id: Owner user ID
        
        Returns:
            DeploymentResult with deployment status and URL
        """
        import os
        import tempfile
        import asyncio
        from app.core.config import get_settings
        
        settings = get_settings()
        
        if not self.is_configured():
            local_url = f"http://localhost:8000/sites/{subdomain}"
            return DeploymentResult(
                success=True,
                subdomain=subdomain,
                live_url=local_url,
                message="Deployed locally (Cloudflare not configured)",
                ssl_status="n/a"
            )
        
        # Create a temporary directory for all site files
        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                # Write all HTML files
                for filename, content in pages.items():
                    file_path = os.path.join(temp_dir, filename)
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(content)
                
                print(f"Deploying multi-page site with files: {list(pages.keys())}")
                
                # Prepare environment for wrangler
                env = os.environ.copy()
                env["CLOUDFLARE_ACCOUNT_ID"] = self.account_id
                env["CLOUDFLARE_API_TOKEN"] = self.api_token
                
                # Construct wrangler command
                cmd = [
                    "npx", "wrangler", "pages", "deploy", temp_dir,
                    "--project-name", self.pages_project,
                    "--branch", subdomain,
                    "--commit-dirty=true"
                ]
                
                print(f"Executing deployment: {' '.join(cmd)}")
                
                # Run wrangler
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env=env,
                    cwd=os.getcwd()
                )
                
                stdout, stderr = await process.communicate()
                
                stdout_str = stdout.decode()
                stderr_str = stderr.decode()
                
                print(f"Wrangler output: {stdout_str}")
                if stderr_str:
                    print(f"Wrangler stderr: {stderr_str}")
                
                if process.returncode == 0:
                    project_subdomain = self.pages_project
                    live_url = f"https://{subdomain}.{project_subdomain}.pages.dev"
                    
                    if self.base_domain and self.base_domain != "setu.local":
                        live_url = f"https://{subdomain}.{self.base_domain}"
                    
                    deployment_id = f"cf-{subdomain}-{int(datetime.now().timestamp())}"
                    
                    return DeploymentResult(
                        success=True,
                        deployment_id=deployment_id,
                        subdomain=subdomain,
                        live_url=live_url,
                        message=f"Multi-page website ({len(pages)} pages) deployed to Cloudflare Pages!",
                        ssl_status="active"
                    )
                else:
                    return DeploymentResult(
                        success=False,
                        subdomain=subdomain,
                        live_url="",
                        message=f"Wrangler failed: {stderr_str}"
                    )
                    
            except Exception as e:
                return DeploymentResult(
                    success=False,
                    subdomain=subdomain,
                    live_url="",
                    message=f"Deployment error: {str(e)}"
                )
    
    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None


# Global instance
cloudflare_service = CloudflareService()
