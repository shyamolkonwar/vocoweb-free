"""
Tasks API Routes
Endpoints for checking async task status and results.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from celery.result import AsyncResult

from app.core.celery_app import celery_app
from app.core.auth_middleware import require_auth, AuthUser
from fastapi import Depends

router = APIRouter()


class TaskStatus(BaseModel):
    """Task status response."""
    task_id: str
    status: str
    progress: Optional[int] = None
    step: Optional[str] = None
    message: Optional[str] = None
    result: Optional[Any] = None
    error: Optional[str] = None


@router.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task_status(
    task_id: str,
    user: AuthUser = Depends(require_auth)  # SECURITY: VULN-03 fix
):
    """
    Get the status of an async task.
    
    Status values:
    - PENDING: Task not yet started
    - STARTED: Task has been picked up by worker
    - PROGRESS: Task is running (with progress info)
    - SUCCESS: Task completed successfully
    - FAILURE: Task failed
    - RETRY: Task is being retried
    """
    task = AsyncResult(task_id, app=celery_app)
    
    response = TaskStatus(
        task_id=task_id,
        status=task.state
    )
    
    if task.state == "PENDING":
        response.message = "Task is waiting to be processed..."
    
    elif task.state == "STARTED":
        response.message = "Task has started..."
        response.progress = 5
    
    elif task.state == "PROGRESS":
        # Get progress metadata
        info = task.info or {}
        response.step = info.get("step")
        response.message = info.get("message", "Processing...")
        response.progress = info.get("progress", 50)
    
    elif task.state == "SUCCESS":
        result = task.result
        if isinstance(result, dict):
            if result.get("status") == "failed":
                # Task completed but returned an error
                response.status = "FAILED"
                response.error = result.get("error", "Unknown error")
            else:
                response.result = result
                response.progress = 100
                response.message = "Complete!"
        else:
            response.result = result
            response.progress = 100
    
    elif task.state == "FAILURE":
        response.error = str(task.result) if task.result else "Task failed"
    
    elif task.state == "RETRY":
        response.message = "Task is being retried..."
    
    return response


@router.delete("/tasks/{task_id}")
async def cancel_task(
    task_id: str,
    user: AuthUser = Depends(require_auth)  # SECURITY: VULN-03 fix
):
    """
    Cancel/revoke a pending or running task.
    """
    task = AsyncResult(task_id, app=celery_app)
    
    if task.state in ["SUCCESS", "FAILURE"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel a completed task"
        )
    
    # Revoke the task
    celery_app.control.revoke(task_id, terminate=True)
    
    return {
        "task_id": task_id,
        "message": "Task cancellation requested"
    }
