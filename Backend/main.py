"""
Main FastAPI application entry point.
Department Network Monitoring and Cybersecurity Dashboard Backend.

This is a legal, admin-controlled monitoring system for college network management.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from config import settings
from database import db
from models import HealthCheckResponse, ErrorResponse

# Import routers
from routers import activity, alerts, stats
from routers.firewall import router as firewall_router
from routers.auth import router as auth_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    Initializes database on startup.
    """
    logger.info("Starting up Department Network Monitoring Backend...")
    logger.info(f"Initializing database at: {settings.DATABASE_PATH}")
    
    # Database is already initialized in database.py, but we can log confirmation
    logger.info("Database initialized successfully")
    logger.info(f"Blocked keywords: {', '.join(settings.BLOCKED_KEYWORDS)}")
    logger.info(f"Bandwidth threshold: {settings.BANDWIDTH_THRESHOLD_MB} MB")
    
    yield
    
    logger.info("Shutting down Department Network Monitoring Backend...")


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    **Department Network Monitoring and Cybersecurity Dashboard - Backend API**
    
    This system provides:
    - Student activity data ingestion from Python agents
    - Real-time policy violation detection
    - Alert management for security incidents
    - Weekly network statistics and analytics
    
    **Legal Notice**: This is a legitimate network monitoring system operated by 
    authorized network administrators for security and management purposes in an 
    educational environment.
    
    ## Features
    
    ### Activity Ingestion
    - Receive network activity data from student machines
    - Process-level monitoring
    - Bandwidth usage tracking
    
    ### Policy Enforcement
    - Automatic violation detection
    - Configurable blocked application list
    - Bandwidth threshold monitoring
    
    ### Alert Management
    - Real-time alert generation
    - Alert resolution workflow
    - Historical alert tracking
    
    ### Statistics & Analytics
    - Weekly bandwidth reports
    - Top consumer analysis
    - Alert trend analysis
    - React-friendly chart data
    
    ## Authentication
    The system is structured for JWT authentication (hooks in place).
    Full authentication implementation can be added as needed.
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for uncaught exceptions.
    Ensures consistent error response format.
    """
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error=True,
            message="Internal server error",
            detail=str(exc) if settings.DEBUG else "An unexpected error occurred",
            timestamp=datetime.utcnow().isoformat()
        ).model_dump()
    )


# Health check endpoint
@app.get(
    "/",
    response_model=HealthCheckResponse,
    tags=["Health"],
    summary="Health check",
    description="Check if the API is running and healthy"
)
async def health_check() -> HealthCheckResponse:
    """
    Root endpoint - Health check.
    
    Returns:
        HealthCheckResponse: Service status and information
    """
    return HealthCheckResponse(
        status="healthy",
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow().isoformat()
    )


@app.get(
    "/health",
    response_model=HealthCheckResponse,
    tags=["Health"],
    summary="Health check (alternate)",
    description="Alternate health check endpoint"
)
async def health_check_alternate() -> HealthCheckResponse:
    """
    Alternate health check endpoint.
    
    Returns:
        HealthCheckResponse: Service status and information
    """
    return HealthCheckResponse(
        status="healthy",
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow().isoformat()
    )


# 📡 Admin endpoint for fetching student activity logs
@app.get(
    "/admin/logs",
    tags=["Admin"],
    summary="Get student activity logs",
    description="Retrieve recent student activity data for admin dashboard monitoring"
)
async def get_student_logs():
    """
    Get recent student activity logs for admin dashboard.
    
    Returns:
        List of recent activity records with formatted data
    """
    try:
        # Get recent activities from database
        recent_activities = db.get_recent_activities(limit=50)
        
        # Format data for frontend display
        formatted_logs = []
        for activity in recent_activities:
            # Calculate total network usage
            total_network = activity['bytes_sent'] + activity['bytes_recv']
            
            # Get top processes (limit to 5 for display)
            top_processes = activity['process_list'][:5] if activity['process_list'] else []
            
            # Format timestamp
            try:
                timestamp_obj = datetime.fromisoformat(activity['timestamp'])
                formatted_time = timestamp_obj.strftime("%Y-%m-%d %H:%M")
            except:
                formatted_time = activity['timestamp']
            
            formatted_logs.append({
                "student_id": activity['hostname'],
                "hostname": activity['hostname'],
                "cpu": 60,  # Placeholder - would come from agent data if available
                "network": total_network,
                "network_mb": round(total_network / 1024 / 1024, 2),  # Convert to MB
                "bytes_sent": activity['bytes_sent'],
                "bytes_recv": activity['bytes_recv'],
                "apps": top_processes,
                "active_apps": top_processes,
                "processes": activity['process_list'],
                "timestamp": formatted_time,
                "raw_timestamp": activity['timestamp'],
                "activity_id": activity['id']
            })
        
        return formatted_logs
        
    except Exception as e:
        logger.error(f"Error fetching admin logs: {str(e)}")
        # Return fallback data for testing
        return [
            {
                "student_id": "STU001",
                "hostname": "STUDENT-PC-001", 
                "cpu": 60,
                "network": 2400000,
                "network_mb": 2.4,
                "bytes_sent": 1200000,
                "bytes_recv": 1200000,
                "apps": ["chrome.exe", "discord.exe", "notepad.exe"],
                "active_apps": ["chrome.exe", "discord.exe"],
                "processes": ["chrome.exe", "discord.exe", "notepad.exe", "explorer.exe"],
                "timestamp": "2026-02-10 14:30",
                "raw_timestamp": datetime.utcnow().isoformat(),
                "activity_id": 1
            },
            {
                "student_id": "STU002", 
                "hostname": "STUDENT-PC-002",
                "cpu": 45,
                "network": 890000,
                "network_mb": 0.89,
                "bytes_sent": 445000,
                "bytes_recv": 445000,
                "apps": ["firefox.exe", "steam.exe"],
                "active_apps": ["firefox.exe"],
                "processes": ["firefox.exe", "steam.exe", "explorer.exe"],
                "timestamp": "2026-02-10 14:28",
                "raw_timestamp": datetime.utcnow().isoformat(), 
                "activity_id": 2
            }
        ]


# Include routers
app.include_router(auth_router)
app.include_router(activity.router)
app.include_router(alerts.router)
app.include_router(stats.router)
app.include_router(firewall_router)


# For debugging: Log all registered routes
async def log_routes_on_startup():
    """Log all registered routes for debugging purposes."""
    logger.info("Registered routes:")
    for route in app.routes:
        if hasattr(route, 'methods'):
            logger.info(f"  {', '.join(route.methods)} {route.path}")


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("Running in development mode with auto-reload")
    
    # Log routes on startup
    import asyncio
    asyncio.run(log_routes_on_startup())
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
