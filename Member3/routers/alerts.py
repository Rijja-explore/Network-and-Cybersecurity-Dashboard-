"""
Alerts router - Handles alert management and retrieval.
Provides endpoints for viewing and resolving security alerts.
"""
from fastapi import APIRouter, HTTPException, status, Path
from typing import Dict, Any
import logging

from models import AlertResponse, AlertListResponse, AlertResolveResponse
from database import db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"],
    responses={
        404: {"description": "Not found"}
    }
)


@router.get(
    "",
    response_model=AlertListResponse,
    summary="Get all alerts",
    description="""
    Retrieve all alerts from the system, both active and resolved.
    
    Returns alerts in descending order by timestamp (newest first).
    Useful for historical analysis and audit trails.
    """
)
async def get_all_alerts() -> AlertListResponse:
    """
    Retrieve all alerts.
    
    Returns:
        AlertListResponse: List of all alerts with count
    
    Raises:
        HTTPException: If database operation fails
    """
    try:
        alerts_data = db.get_all_alerts()
        
        alerts = [
            AlertResponse(
                id=alert['id'],
                hostname=alert['hostname'],
                reason=alert['reason'],
                severity=alert['severity'],
                status=alert['status'],
                timestamp=alert['timestamp'],
                resolved_at=alert['resolved_at'],
                activity_id=alert['activity_id']
            )
            for alert in alerts_data
        ]
        
        logger.info(f"Retrieved {len(alerts)} total alerts")
        
        return AlertListResponse(
            alerts=alerts,
            total=len(alerts)
        )
    
    except Exception as e:
        logger.error(f"Error retrieving alerts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve alerts: {str(e)}"
        )


@router.get(
    "/active",
    response_model=AlertListResponse,
    summary="Get active alerts",
    description="""
    Retrieve only unresolved (active) alerts.
    
    This endpoint is commonly used for the main dashboard view
    where administrators need to see pending security issues.
    """
)
async def get_active_alerts() -> AlertListResponse:
    """
    Retrieve active (unresolved) alerts.
    
    Returns:
        AlertListResponse: List of active alerts with count
    
    Raises:
        HTTPException: If database operation fails
    """
    try:
        alerts_data = db.get_active_alerts()
        
        alerts = [
            AlertResponse(
                id=alert['id'],
                hostname=alert['hostname'],
                reason=alert['reason'],
                severity=alert['severity'],
                status=alert['status'],
                timestamp=alert['timestamp'],
                resolved_at=alert['resolved_at'],
                activity_id=alert['activity_id']
            )
            for alert in alerts_data
        ]
        
        logger.info(f"Retrieved {len(alerts)} active alerts")
        
        return AlertListResponse(
            alerts=alerts,
            total=len(alerts)
        )
    
    except Exception as e:
        logger.error(f"Error retrieving active alerts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve active alerts: {str(e)}"
        )


@router.patch(
    "/{alert_id}/resolve",
    response_model=AlertResolveResponse,
    summary="Resolve an alert",
    description="""
    Mark an alert as resolved.
    
    This endpoint should be called when an administrator has:
    - Investigated the alert
    - Taken appropriate action
    - Decided the issue is resolved
    
    The alert will be timestamped with the resolution time.
    """
)
async def resolve_alert(
    alert_id: int = Path(..., description="ID of the alert to resolve", ge=1)
) -> AlertResolveResponse:
    """
    Resolve an alert by ID.
    
    Args:
        alert_id: ID of the alert to mark as resolved
    
    Returns:
        AlertResolveResponse: Confirmation of resolution
    
    Raises:
        HTTPException: If alert not found or database operation fails
    """
    try:
        success = db.resolve_alert(alert_id)
        
        if not success:
            logger.warning(f"Alert {alert_id} not found or already resolved")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert {alert_id} not found or already resolved"
            )
        
        logger.info(f"Alert {alert_id} marked as resolved")
        
        return AlertResolveResponse(
            success=True,
            alert_id=alert_id,
            message="Alert resolved successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving alert {alert_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resolve alert: {str(e)}"
        )


@router.get(
    "/test",
    summary="Test endpoint",
    description="Simple test endpoint to verify the alerts router is working"
)
async def test_alerts_router() -> Dict[str, Any]:
    """
    Test endpoint for alerts router.
    
    Returns:
        dict: Simple test response
    """
    return {
        "status": "ok",
        "router": "alerts",
        "message": "Alerts router is working"
    }
