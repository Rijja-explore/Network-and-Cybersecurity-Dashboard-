"""
Firewall router - Handles IP blocking and firewall management.
Integrates with Windows Firewall for network security enforcement.
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import subprocess
import logging
import platform

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/firewall",
    tags=["Firewall"],
    responses={
        404: {"description": "Not found"},
        422: {"description": "Validation error"},
        403: {"description": "Insufficient privileges"}
    }
)


class BlockIPRequest(BaseModel):
    """Request model for IP blocking."""
    ip: str = Field(..., description="IP address to block", examples=["192.168.1.100"])
    reason: str = Field(default="Policy violation", description="Reason for blocking")


class BlockIPResponse(BaseModel):
    """Response model for IP blocking."""
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Operation result message")
    ip: str = Field(..., description="IP address that was processed")


@router.post(
    "/block",
    response_model=BlockIPResponse,
    status_code=status.HTTP_200_OK,
    summary="Block IP address",
    description="""
    Blocks an IP address using Windows Firewall.
    
    **Requirements**:
    - Must run as Administrator
    - Windows operating system
    
    **Note**: This endpoint requires administrative privileges to modify firewall rules.
    """
)
async def block_ip(request: BlockIPRequest) -> BlockIPResponse:
    """
    Block an IP address using Windows Firewall.
    
    Args:
        request: BlockIPRequest containing IP and reason
        
    Returns:
        BlockIPResponse with operation result
        
    Raises:
        HTTPException: If blocking fails or insufficient privileges
    """
    try:
        # Validate platform
        if platform.system() != "Windows":
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="IP blocking is only supported on Windows systems"
            )
        
        # Construct Windows Firewall command
        rule_name = f"Block {request.ip} - {request.reason}"
        command = [
            'netsh', 'advfirewall', 'firewall', 'add', 'rule',
            f'name={rule_name}',
            'dir=out',
            'action=block',
            f'remoteip={request.ip}'
        ]
        
        logger.info(f"Attempting to block IP {request.ip} for reason: {request.reason}")
        
        # Execute firewall command
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            logger.info(f"Successfully blocked IP {request.ip}")
            return BlockIPResponse(
                success=True,
                message=f"IP {request.ip} has been blocked successfully",
                ip=request.ip
            )
        else:
            error_msg = result.stderr or "Unknown error occurred"
            logger.error(f"Failed to block IP {request.ip}: {error_msg}")
            
            if "access is denied" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient privileges. Run as Administrator to manage firewall rules."
                )
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to block IP: {error_msg}"
            )
            
    except subprocess.TimeoutExpired:
        logger.error(f"Timeout while blocking IP {request.ip}")
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Firewall operation timed out"
        )
    except Exception as e:
        logger.error(f"Unexpected error blocking IP {request.ip}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/status",
    summary="Get firewall status",
    description="Check if the firewall service is running and accessible."
)
async def get_firewall_status():
    """Get current firewall status."""
    try:
        if platform.system() != "Windows":
            return {
                "status": "unsupported",
                "message": "Firewall management only supported on Windows"
            }
        
        # Check if firewall service is accessible
        result = subprocess.run(
            ['netsh', 'advfirewall', 'show', 'currentprofile'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            return {
                "status": "available",
                "message": "Windows Firewall is accessible",
                "requires_admin": True
            }
        else:
            return {
                "status": "error", 
                "message": "Unable to access Windows Firewall"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error checking firewall status: {str(e)}"
        }