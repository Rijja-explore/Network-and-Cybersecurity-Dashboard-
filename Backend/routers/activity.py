"""
Activity router - Handles student activity data submission.
Receives data from Python agents on student machines.
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
import logging

from models import ActivityRequest, ActivityResponse
from database import db
from alerts import detector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/activity",
    tags=["Activity"],
    responses={
        404: {"description": "Not found"},
        422: {"description": "Validation error"}
    }
)


@router.post(
    "",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit student activity data",
    description="""
    Receives activity data from student machines via Python agent.
    
    This endpoint:
    1. Validates incoming activity data
    2. Stores activity in the database
    3. Checks for policy violations
    4. Creates alerts if violations are detected
    
    **Legal Notice**: This is a legitimate network monitoring system used by
    authorized administrators for network management and security purposes.
    """
)
async def submit_activity(activity: ActivityRequest) -> ActivityResponse:
    """
    Process and store student activity data.
    
    Args:
        activity: Activity data from student machine
    
    Returns:
        ActivityResponse: Confirmation with activity ID and violation status
    
    Raises:
        HTTPException: If database operation fails
    """
    try:
        # Extract domains from destinations
        domains = []
        if activity.destinations:
            domains = [d.get('domain') or d.get('ip') for d in activity.destinations if d.get('domain') or d.get('ip')]
        
        # Combine with legacy websites field
        all_websites = list(set(domains + (activity.websites or [])))
        
        # 📥 Print for monitoring
        print("📥 Activity received:", {
            "hostname": activity.hostname,
            "bytes_sent": activity.bytes_sent,
            "bytes_recv": activity.bytes_recv,
            "processes": activity.processes[:3] if len(activity.processes) > 3 else activity.processes,
            "destinations": activity.destinations[:3] if len(activity.destinations) > 3 else activity.destinations,
            "websites": all_websites[:3] if len(all_websites) > 3 else all_websites,
            "total_processes": len(activity.processes),
            "total_destinations": len(activity.destinations),
            "agent_time": activity.timestamp
        })
        
        # Log incoming activity
        logger.info(
            f"Received activity from {activity.hostname}: "
            f"{activity.bytes_sent + activity.bytes_recv} bytes, "
            f"{len(activity.processes)} processes, {len(activity.destinations)} destinations"
        )
        
        # Store activity in database
        activity_id = db.insert_activity(
            hostname=activity.hostname,
            bytes_sent=activity.bytes_sent,
            bytes_recv=activity.bytes_recv,
            processes=activity.processes,
            websites=all_websites,
            destinations=activity.destinations,
            agent_timestamp=activity.timestamp
        )
        
        # Check for policy violations
        violation_result = detector.check_violations(
            processes=activity.processes,
            bytes_sent=activity.bytes_sent,
            bytes_recv=activity.bytes_recv,
            hostname=activity.hostname
        )
        
        alert_id = None
        
        # Create alert if violation detected
        if violation_result.violation:
            logger.warning(
                f"Policy violation detected for {activity.hostname}: "
                f"{violation_result.reason}"
            )
            
            alert_id = db.insert_alert(
                hostname=activity.hostname,
                reason=violation_result.reason,
                severity=violation_result.severity,
                activity_id=activity_id
            )
        
        # Build response
        return ActivityResponse(
            success=True,
            activity_id=activity_id,
            message="Activity recorded successfully",
            violation_detected=violation_result.violation,
            alert_id=alert_id
        )
    
    except Exception as e:
        logger.error(f"Error processing activity: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process activity: {str(e)}"
        )


@router.get(
    "/test",
    summary="Test endpoint",
    description="Simple test endpoint to verify the activity router is working"
)
async def test_activity_router() -> Dict[str, Any]:
    """
    Test endpoint for activity router.
    
    Returns:
        dict: Simple test response
    """
    return {
        "status": "ok",
        "router": "activity",
        "message": "Activity router is working"
    }
