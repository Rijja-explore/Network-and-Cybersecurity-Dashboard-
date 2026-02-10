"""
Statistics router - Provides network analytics and statistics.
Delivers chart-ready data for the admin dashboard.
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
import logging

from models import WeeklyStatsResponse
from stats import stats_engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/stats",
    tags=["Statistics"],
    responses={
        500: {"description": "Internal server error"}
    }
)


@router.get(
    "/weekly",
    response_model=WeeklyStatsResponse,
    summary="Get weekly statistics",
    description="""
    Retrieve comprehensive weekly network statistics.
    
    This endpoint provides:
    - Total bandwidth usage (bytes, MB, GB)
    - Number of active students
    - Alert counts and severity breakdown
    - Top 10 bandwidth-consuming hosts
    
    **Data is optimized for React charts and dashboards.**
    
    The statistics cover the last 7 days from the current time.
    """
)
async def get_weekly_statistics() -> WeeklyStatsResponse:
    """
    Calculate and return weekly statistics.
    
    Returns:
        WeeklyStatsResponse: Comprehensive weekly statistics
    
    Raises:
        HTTPException: If calculation fails
    """
    try:
        logger.info("Calculating weekly statistics")
        
        stats = stats_engine.calculate_weekly_stats()
        
        logger.info(
            f"Statistics generated: {stats.active_students} students, "
            f"{stats.total_bandwidth_gb:.2f} GB total, "
            f"{stats.alert_count} alerts"
        )
        
        return stats
    
    except Exception as e:
        logger.error(f"Error calculating weekly statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate statistics: {str(e)}"
        )


@router.get(
    "/bandwidth-summary",
    summary="Get bandwidth summary",
    description="""
    Get a simplified bandwidth summary for quick dashboard display.
    
    Provides:
    - Total bandwidth in GB
    - Active student count
    - Average bandwidth per student
    """
)
async def get_bandwidth_summary() -> Dict[str, Any]:
    """
    Get simplified bandwidth statistics.
    
    Returns:
        dict: Bandwidth summary with total, students, and average
    
    Raises:
        HTTPException: If calculation fails
    """
    try:
        summary = stats_engine.get_bandwidth_summary()
        
        logger.info(f"Bandwidth summary: {summary['total_gb']} GB")
        
        return {
            "success": True,
            "data": summary
        }
    
    except Exception as e:
        logger.error(f"Error calculating bandwidth summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate bandwidth summary: {str(e)}"
        )


@router.get(
    "/alerts-summary",
    summary="Get alerts summary",
    description="""
    Get alert statistics summary including counts and severity breakdown.
    
    Useful for quick dashboard widgets showing alert status.
    """
)
async def get_alerts_summary() -> Dict[str, Any]:
    """
    Get alert statistics summary.
    
    Returns:
        dict: Alert summary with counts and percentages
    
    Raises:
        HTTPException: If calculation fails
    """
    try:
        summary = stats_engine.get_alert_summary()
        
        logger.info(f"Alert summary: {summary['total_alerts']} total alerts")
        
        return {
            "success": True,
            "data": summary
        }
    
    except Exception as e:
        logger.error(f"Error calculating alerts summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate alerts summary: {str(e)}"
        )


@router.get(
    "/top-consumers",
    summary="Get top bandwidth consumers",
    description="""
    Get the top bandwidth-consuming hosts for the last 7 days.
    
    Returns up to 10 hosts sorted by total bandwidth usage.
    """
)
async def get_top_consumers() -> Dict[str, Any]:
    """
    Get top bandwidth consumers.
    
    Returns:
        dict: List of top bandwidth-consuming hosts
    
    Raises:
        HTTPException: If calculation fails
    """
    try:
        top_hosts = stats_engine.get_top_consumers(limit=10)
        
        logger.info(f"Retrieved {len(top_hosts)} top consumers")
        
        return {
            "success": True,
            "data": [host.model_dump() for host in top_hosts]
        }
    
    except Exception as e:
        logger.error(f"Error retrieving top consumers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve top consumers: {str(e)}"
        )


@router.get(
    "/test",
    summary="Test endpoint",
    description="Simple test endpoint to verify the stats router is working"
)
async def test_stats_router() -> Dict[str, Any]:
    """
    Test endpoint for stats router.
    
    Returns:
        dict: Simple test response
    """
    return {
        "status": "ok",
        "router": "stats",
        "message": "Stats router is working"
    }
