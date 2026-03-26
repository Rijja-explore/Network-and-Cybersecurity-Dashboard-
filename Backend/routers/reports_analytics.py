"""
Reports & Analytics Router
=========================
FastAPI router for advanced analytics and report generation endpoints.

This router integrates the reports_analytics module into the main backend,
providing analytics dashboards and comprehensive reporting capabilities.

Endpoints:
- GET /api/analytics/summary - Get summary analytics
- GET /api/analytics/charts/network - Get network usage chart data  
- GET /api/analytics/charts/alerts - Get alerts chart data
- GET /api/analytics/reports/weekly - Get comprehensive weekly report
- GET /api/analytics/reports/weekly/csv - Download weekly report as CSV

Usage:
    Register this router in Backend/main.py:
    
    from routers.reports_analytics import router as reports_analytics_router
    app.include_router(reports_analytics_router)
"""
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional
from datetime import datetime
import io
import logging

# Import services
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.analytics_service import (
    calculate_summary,
    get_network_chart_data,
    get_alerts_chart_data
)
from services.reports_service import generate_weekly_report, export_report_csv

# Configure logging
logger = logging.getLogger(__name__)

# Create router with prefix
router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics & Reports"]
)


# ============================================
# Analytics Endpoints
# ============================================

@router.get("/summary")
async def get_analytics_summary() -> Dict[str, Any]:
    """
    Get summary analytics for the dashboard.
    
    Returns:
        Dictionary containing:
        - total_alerts: Total number of alerts
        - alerts_by_severity: Breakdown by severity level
        - active_users: Count of unique active students
        - total_bandwidth_mb: Total bandwidth usage
        - avg_bandwidth_mb: Average bandwidth per session
        - top_applications: Most used applications
    
    Example Response:
        {
            "success": True,
            "data": {
                "total_alerts": 42,
                "alerts_by_severity": {
                    "critical": 5,
                    "warning": 12,
                    "info": 25
                },
                "active_users": 150,
                "total_bandwidth_mb": 52341.23,
                "avg_bandwidth_mb": 348.94,
                "top_applications": [...]
            }
        }
    """
    try:
        logger.info("Fetching analytics summary")
        summary = calculate_summary()
        return {
            "success": True,
            "data": summary
        }
    except Exception as e:
        logger.error(f"Error calculating analytics summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating summary: {str(e)}"
        )


@router.get("/charts/network")
async def get_network_charts() -> Dict[str, Any]:
    """
    Get network usage data formatted for frontend charts.
    
    Returns:
        Dictionary containing:
        - time_series: Bandwidth over time (for line charts)
        - per_student: Bandwidth per student (for bar charts)  
        - hourly_pattern: Usage by hour (for area charts)
        - chart_config: Suggested chart labels and titles
    
    Frontend Usage (Recharts):
        const response = await api.get('/api/analytics/charts/network');
        const { time_series } = response.data;
        
        <LineChart data={time_series}>
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Line dataKey="bandwidth" />
        </LineChart>
    """
    try:
        logger.info("Fetching network chart data")
        chart_data = get_network_chart_data()
        return {
            "success": True,
            "data": chart_data
        }
    except Exception as e:
        logger.error(f"Error fetching network chart data: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching network chart data: {str(e)}"
        )


@router.get("/charts/alerts")
async def get_alert_charts() -> Dict[str, Any]:
    """
    Get alerts data formatted for frontend charts.
    
    Returns:
        Dictionary containing:
        - by_severity: Alert counts by severity (for pie/donut charts)
        - by_type: Alert counts by violation type (for bar charts)
        - daily_trend: Alerts over time (for line charts)
        - recent_alerts: Latest 5 alerts
        - total_alerts: Total count
    
    Frontend Usage (Recharts):
        const response = await api.get('/api/analytics/charts/alerts');
        const { by_severity } = response.data;
        
        <PieChart>
            <Pie data={by_severity} dataKey="count" nameKey="severity" />
        </PieChart>
    """
    try:
        logger.info("Fetching alerts chart data")
        chart_data = get_alerts_chart_data()
        return {
            "success": True,
            "data": chart_data
        }
    except Exception as e:
        logger.error(f"Error fetching alerts chart data: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching alerts chart data: {str(e)}"
        )


# ============================================
# Reports Endpoints
# ============================================

@router.get("/reports/weekly")
async def get_weekly_report() -> Dict[str, Any]:
    """
    Get comprehensive weekly report.
    
    Returns comprehensive report with:
    - Report period metadata
    - Executive summary
    - Network usage analysis
    - Security alerts breakdown
    - Per-student activity summary
    - Actionable recommendations
    
    Future Enhancement:
        Add query parameters for custom date ranges:
        ?start_date=2026-01-01&end_date=2026-01-07
    """
    try:
        logger.info("Generating weekly report")
        
        # TODO: Parse optional query parameters for date range
        # For now, defaults to last 7 days in the service
        report = generate_weekly_report()
        
        return {
            "success": True,
            "data": report
        }
    except Exception as e:
        logger.error(f"Error generating weekly report: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating report: {str(e)}"
        )


@router.get("/reports/weekly/csv")
async def download_weekly_report_csv():
    """
    Download weekly report as CSV file.
    
    Returns:
        CSV file as download attachment
        
    Example Usage (Frontend):
        const response = await api.get('/api/analytics/reports/weekly/csv', {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'weekly_report.csv');
        document.body.appendChild(link);
        link.click();
    """
    try:
        logger.info("Generating weekly report CSV")
        
        # Generate report data
        report = generate_weekly_report()
        
        # Convert to CSV
        csv_content = export_report_csv(report)
        
        # Create filename with current date
        filename = f"weekly_report_{datetime.now().strftime('%Y%m%d')}.csv"
        
        # Return as streaming response
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        logger.error(f"Error generating CSV report: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating CSV report: {str(e)}"
        )


# ============================================
# Health Check
# ============================================

@router.get("/health")
async def analytics_health():
    """
    Health check for analytics module.
    
    Returns:
        Status of analytics service
    """
    return {
        "status": "healthy",
        "service": "analytics",
        "timestamp": datetime.now().isoformat()
    }
