"""
Pydantic models for request validation and response serialization.
Defines the data structures for all API endpoints.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime


# ============================================================================
# ACTIVITY MODELS
# ============================================================================

class ActivityRequest(BaseModel):
    """
    Request model for student activity data submission.
    Sent by the Python agent running on student machines.
    """
    hostname: str = Field(
        ..., 
        description="Student machine hostname",
        min_length=1,
        max_length=255,
        examples=["STUDENT01"]
    )
    bytes_sent: int = Field(
        ..., 
        ge=0,
        description="Total bytes sent by the machine"
    )
    bytes_recv: int = Field(
        ..., 
        ge=0,
        description="Total bytes received by the machine"
    )
    processes: List[str] = Field(
        ..., 
        description="List of running process names",
        min_length=0
    )
    
    @field_validator('hostname')
    @classmethod
    def validate_hostname(cls, v: str) -> str:
        """Ensure hostname is not empty and trim whitespace."""
        hostname = v.strip()
        if not hostname:
            raise ValueError("Hostname cannot be empty")
        return hostname
    
    @field_validator('processes')
    @classmethod
    def validate_processes(cls, v: List[str]) -> List[str]:
        """Validate and clean process list."""
        return [p.strip().lower() for p in v if p.strip()]


class ActivityResponse(BaseModel):
    """Response model for activity submission."""
    success: bool = Field(..., description="Whether the activity was recorded")
    activity_id: int = Field(..., description="ID of the created activity record")
    message: str = Field(..., description="Response message")
    violation_detected: bool = Field(..., description="Whether a policy violation was detected")
    alert_id: Optional[int] = Field(None, description="ID of created alert if violation occurred")


# ============================================================================
# ALERT MODELS
# ============================================================================

class AlertResponse(BaseModel):
    """Response model for alert data."""
    id: int = Field(..., description="Alert ID")
    hostname: str = Field(..., description="Machine hostname")
    reason: str = Field(..., description="Violation reason")
    severity: str = Field(..., description="Alert severity level")
    status: str = Field(..., description="Alert status (active/resolved)")
    timestamp: str = Field(..., description="When the alert was created (ISO format)")
    resolved_at: Optional[str] = Field(None, description="When the alert was resolved (ISO format)")
    activity_id: Optional[int] = Field(None, description="Associated activity ID")


class AlertListResponse(BaseModel):
    """Response model for list of alerts."""
    alerts: List[AlertResponse] = Field(..., description="List of alerts")
    total: int = Field(..., description="Total number of alerts")


class AlertResolveResponse(BaseModel):
    """Response model for alert resolution."""
    success: bool = Field(..., description="Whether the alert was resolved")
    alert_id: int = Field(..., description="ID of the alert")
    message: str = Field(..., description="Response message")


# ============================================================================
# VIOLATION DETECTION MODELS
# ============================================================================

class ViolationResult(BaseModel):
    """Result of policy violation check."""
    violation: bool = Field(..., description="Whether a violation occurred")
    reason: Optional[str] = Field(None, description="Description of the violation")
    severity: str = Field(default="medium", description="Severity level")
    violated_processes: List[str] = Field(
        default_factory=list, 
        description="List of processes that triggered the violation"
    )


# ============================================================================
# STATISTICS MODELS
# ============================================================================

class BandwidthHostStats(BaseModel):
    """Statistics for a single host's bandwidth usage."""
    hostname: str = Field(..., description="Machine hostname")
    total_sent: int = Field(..., description="Total bytes sent")
    total_recv: int = Field(..., description="Total bytes received")
    total_bandwidth: int = Field(..., description="Total bandwidth (sent + received)")


class WeeklyStatsResponse(BaseModel):
    """Response model for weekly statistics."""
    period: str = Field(..., description="Statistics period", examples=["Last 7 days"])
    total_bytes_sent: int = Field(..., description="Total bytes sent by all machines")
    total_bytes_recv: int = Field(..., description="Total bytes received by all machines")
    total_bandwidth: int = Field(..., description="Total bandwidth (sent + received)")
    total_bandwidth_mb: float = Field(..., description="Total bandwidth in MB")
    total_bandwidth_gb: float = Field(..., description="Total bandwidth in GB")
    active_students: int = Field(..., description="Number of unique active students")
    alert_count: int = Field(..., description="Total number of alerts this week")
    alerts_by_severity: Dict[str, int] = Field(
        ..., 
        description="Alert count grouped by severity"
    )
    top_bandwidth_hosts: List[BandwidthHostStats] = Field(
        ..., 
        description="Top 10 bandwidth-consuming hosts"
    )
    generated_at: str = Field(..., description="When these stats were generated (ISO format)")


# ============================================================================
# HEALTH CHECK MODELS
# ============================================================================

class HealthCheckResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str = Field(..., description="Service status", examples=["healthy"])
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    timestamp: str = Field(..., description="Current server time (ISO format)")


# ============================================================================
# ERROR MODELS
# ============================================================================

class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: bool = Field(default=True, description="Indicates an error occurred")
    message: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Additional error details")
    timestamp: str = Field(..., description="When the error occurred (ISO format)")
