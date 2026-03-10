"""
FastAPI Backend for Reports & Analytics Module
==============================================
Network Health & Cybersecurity Monitoring Dashboard

This is the analytics microservice for the cybersecurity monitoring project.
It provides REST API endpoints for dashboard analytics and reporting.

RUNNING THE SERVER:
    cd reports_analytics/backend
    pip install fastapi uvicorn
    uvicorn main:app --reload --port 8000

API DOCUMENTATION:
    http://localhost:8000/docs (Swagger UI)
    http://localhost:8000/redoc (ReDoc)

INTEGRATION NOTES:
- Currently uses mock JSON data files
- To connect to main backend database:
  1. Add database connection (SQLAlchemy/databases)
  2. Replace mock data functions with DB queries
  3. Update CORS origins for production
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Dict, Any
import io

# Import analytics and reports modules
from analytics import (
    calculate_summary,
    get_network_chart_data,
    get_alerts_chart_data
)
from reports import generate_weekly_report, export_report_csv

# Initialize FastAPI app
app = FastAPI(
    title="Cybersecurity Analytics API",
    description="Analytics and Reporting endpoints for Network Health Monitoring Dashboard",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
# INTEGRATION NOTE: Update origins list when deploying to production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # React dev server
        "http://localhost:5173",      # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Health Check Endpoint
# ============================================

@app.get("/", tags=["Health"])
async def root():
    """API root - health check endpoint."""
    return {
        "status": "online",
        "service": "Analytics & Reports API",
        "version": "1.0.0",
        "endpoints": {
            "analytics": "/analytics/summary",
            "network_charts": "/analytics/charts/network",
            "alert_charts": "/analytics/charts/alerts",
            "weekly_report": "/reports/weekly"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "analytics"}


# ============================================
# Analytics Endpoints
# ============================================

@app.get("/analytics/summary", tags=["Analytics"])
async def get_analytics_summary() -> Dict[str, Any]:
    """
    Get summary analytics for the dashboard.
    
    Returns:
        - total_alerts: Total number of alerts
        - alerts_by_severity: Breakdown by severity level
        - active_users: Count of unique active students
        - total_bandwidth_mb: Total bandwidth usage
        - avg_bandwidth_mb: Average bandwidth per session
        - top_applications: Most used applications
    
    INTEGRATION NOTE:
    Add query parameters for date filtering:
    async def get_analytics_summary(
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    )
    """
    try:
        summary = calculate_summary()
        return {
            "success": True,
            "data": summary
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="Mock data files not found. Ensure mock_activity.json and mock_alerts.json exist."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating summary: {str(e)}"
        )


@app.get("/analytics/charts/network", tags=["Analytics"])
async def get_network_charts() -> Dict[str, Any]:
    """
    Get network usage data formatted for frontend charts.
    
    Returns:
        - time_series: Bandwidth over time (for line chart)
        - per_student: Bandwidth per student (for bar chart)
        - hourly_pattern: Usage by hour (for area chart)
        - chart_config: Suggested chart labels and titles
    
    Frontend Usage Example (Chart.js):
        const response = await api.get('/analytics/charts/network');
        const { time_series, per_student } = response.data.data;
        
        // Line chart data
        lineChartData = {
            labels: time_series.map(d => d.timestamp),
            datasets: [{
                data: time_series.map(d => d.bandwidth),
                label: 'Bandwidth (MB)'
            }]
        };
    """
    try:
        chart_data = get_network_chart_data()
        return {
            "success": True,
            "data": chart_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching network chart data: {str(e)}"
        )


@app.get("/analytics/charts/alerts", tags=["Analytics"])
async def get_alert_charts() -> Dict[str, Any]:
    """
    Get alerts data formatted for frontend charts.
    
    Returns:
        - by_type: Alert frequency by type (for pie/bar chart)
        - by_severity: Distribution by severity (for donut chart)
        - daily_trend: Alerts over time (for line chart)
        - recent_alerts: Latest 5 alerts
        - total_alerts: Total count
    
    Frontend Usage Example (Recharts):
        const response = await api.get('/analytics/charts/alerts');
        const { by_severity } = response.data.data;
        
        <PieChart>
            <Pie data={by_severity} dataKey="count" nameKey="severity" />
        </PieChart>
    """
    try:
        chart_data = get_alerts_chart_data()
        return {
            "success": True,
            "data": chart_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching alerts chart data: {str(e)}"
        )


# ============================================
# Reports Endpoints
# ============================================

@app.get("/reports/weekly", tags=["Reports"])
async def get_weekly_report() -> Dict[str, Any]:
    """
    Generate and return weekly report data.
    
    Returns comprehensive report including:
        - report_period: Date range and metadata
        - executive_summary: Key metrics and health status
        - network_usage: Bandwidth analysis
        - security_alerts: Alert breakdown and analysis
        - student_activity: Per-student summary
        - recommendations: Actionable insights
    
    INTEGRATION NOTE:
    Add date parameters for custom report periods:
    async def get_weekly_report(
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    )
    """
    try:
        report = generate_weekly_report()
        return {
            "success": True,
            "data": report
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating weekly report: {str(e)}"
        )


@app.get("/reports/weekly/csv", tags=["Reports"])
async def download_weekly_report_csv():
    """
    Download weekly report as CSV file.
    
    INTEGRATION NOTE:
    For PDF export, add similar endpoint:
    @app.get("/reports/weekly/pdf")
    async def download_weekly_report_pdf():
        report = generate_weekly_report()
        pdf_bytes = generate_pdf(report)  # Implement with reportlab
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=weekly_report.pdf"}
        )
    """
    try:
        report = generate_weekly_report()
        csv_content = export_report_csv(report)
        
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=weekly_report_{report['report_period']['end_date']}.csv"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error exporting report: {str(e)}"
        )


# ============================================
# Error Handlers
# ============================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": "Endpoint not found",
            "available_endpoints": [
                "/analytics/summary",
                "/analytics/charts/network",
                "/analytics/charts/alerts",
                "/reports/weekly",
                "/reports/weekly/csv"
            ]
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


# ============================================
# Main Entry Point
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 50)
    print("Starting Analytics & Reports API Server")
    print("=" * 50)
    print("API Documentation: http://localhost:8000/docs")
    print("=" * 50)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Enable auto-reload for development
    )
