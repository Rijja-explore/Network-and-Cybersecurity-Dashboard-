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


# Include routers
app.include_router(activity.router)
app.include_router(alerts.router)
app.include_router(stats.router)


# For debugging: Log all registered routes on startup
@app.on_event("startup")
async def log_routes():
    """Log all registered routes for debugging purposes."""
    logger.info("Registered routes:")
    for route in app.routes:
        if hasattr(route, 'methods'):
            logger.info(f"  {', '.join(route.methods)} {route.path}")


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("Running in development mode with auto-reload")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
