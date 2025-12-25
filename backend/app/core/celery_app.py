"""
Celery Application Configuration
Central configuration for async task processing.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from celery import Celery

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

# Get Redis URL from environment or use default
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
REDIS_BACKEND_URL = os.getenv("REDIS_BACKEND_URL", "redis://localhost:6379/1")

# Create Celery app
celery_app = Celery(
    "setu_worker",
    broker=REDIS_URL,
    backend=REDIS_BACKEND_URL,
    include=["app.workers.tasks"]  # Auto-discover tasks
)

# Celery configuration
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    
    # Task tracking
    task_track_started=True,
    task_acks_late=True,  # Acknowledge after task completes
    
    # Timeouts
    task_time_limit=600,  # 10 minutes hard limit
    task_soft_time_limit=540,  # 9 minutes soft limit (for cleanup)
    
    # Result expiration
    result_expires=3600,  # 1 hour
    
    # Worker settings
    worker_prefetch_multiplier=1,  # One task at a time (for AI tasks)
    worker_concurrency=2,  # 2 concurrent workers
    
    # Retry settings
    task_default_retry_delay=30,  # 30 seconds
    task_max_retries=3,
    
    # Timezone
    timezone="Asia/Kolkata",
    enable_utc=True,
)

# Optional: Configure task routes for different queues (future scaling)
# celery_app.conf.task_routes = {
#     "app.workers.tasks.generate_website_task": {"queue": "ai-heavy"},
#     "app.workers.tasks.speech_to_text_task": {"queue": "ai-heavy"},
#     "app.workers.tasks.redesign_website_task": {"queue": "low-priority"},
# }
