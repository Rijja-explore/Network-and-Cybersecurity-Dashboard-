"""
Commands router - Handles command polling from student agents.
Students poll this endpoint to check for remote commands from admin.
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Dict, Any
import logging

from database import db

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/commands",
    tags=["Commands"],
    responses={
        404: {"description": "Not found"},
        422: {"description": "Validation error"}
    }
)


@router.get(
    "",
    summary="Get pending commands for student",
    description="""
    Student agents poll this endpoint to check for pending commands.
    
    Commands can include:
    - BLOCK_DOMAIN: Block access to a website
    - UNBLOCK_DOMAIN: Restore access to a website
    - PING: Health check command
    
    This is part of the remote management system where admin dashboard
    can control student machines via backend.
    """
)
async def get_commands(
    student_id: str = Query(..., description="Student hostname/ID")
) -> Dict[str, Any]:
    """
    Get pending commands for a student agent.
    
    Args:
        student_id: Student machine hostname
    
    Returns:
        Dictionary with list of pending commands
    """
    try:
        # Get pending commands from database
        commands = db.get_pending_commands(student_id)
        
        # Mark commands as executed (delivered to agent)
        for cmd in commands:
            db.mark_command_executed(cmd['id'])
        
        if commands:
            logger.info(f"Delivered {len(commands)} command(s) to student {student_id}")
        
        # Format commands for agent
        formatted_commands = []
        for cmd in commands:
            formatted_commands.append({
                "action": cmd['action'],
                "domain": cmd['domain'],
                "reason": cmd['reason']
            })
        
        return {
            "student_id": student_id,
            "commands": formatted_commands,
            "count": len(formatted_commands)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving commands for {student_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve commands: {str(e)}"
        )


@router.get(
    "/blocked-domains",
    summary="Get currently blocked domains for a student",
    description="Returns a list of domains currently blocked for the given student."
)
async def get_blocked_domains(student_id: str = Query(..., description="Student hostname/ID")) -> Dict[str, Any]:
    try:
        blocked_domains = db.get_currently_blocked_domains(student_id)
        return {"student_id": student_id, "blocked_domains": blocked_domains, "count": len(blocked_domains)}
    except Exception as e:
        logger.error(f"Error retrieving blocked domains for {student_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve blocked domains: {str(e)}"
        )

@router.get(
    "/all",
    summary="Get all commands (admin)",
    description="Admin endpoint to view all commands in the system"
)
async def get_all_commands(
    limit: int = Query(100, description="Maximum commands to return")
) -> Dict[str, Any]:
    """
    Get all commands for admin dashboard.
    
    Args:
        limit: Maximum number of commands to return
    
    Returns:
        Dictionary with all commands
    """
    try:
        commands = db.get_all_commands(limit=limit)
        
        return {
            "commands": commands,
            "count": len(commands)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving all commands: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve commands: {str(e)}"
        )
