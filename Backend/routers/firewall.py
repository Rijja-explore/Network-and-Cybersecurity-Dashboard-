"""
Firewall router - Handles IP blocking and firewall management.
Integrates with Windows Firewall for network security enforcement.
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import subprocess
import logging
import platform
import socket

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


@router.post(
    "/block-domain",
    response_model=BlockIPResponse,
    status_code=status.HTTP_200_OK,
    summary="Block domain/website",
    description="""
    Blocks access to a domain or website using Windows Firewall.
    
    **Requirements**:
    - Must run as Administrator
    - Windows operating system
    
    **Note**: Resolves domain to IP addresses and blocks them via firewall.
    """
)
async def block_domain(request: BlockIPRequest) -> BlockIPResponse:
    """
    Block access to a domain using Windows Firewall.
    
    Resolves the domain to IP addresses and creates firewall rules to block them.
    
    Args:
        request: BlockIPRequest with domain in 'ip' field and reason
        
    Returns:
        BlockIPResponse with operation result
    """
    try:
        if platform.system() != "Windows":
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Domain blocking is only supported on Windows systems"
            )
        
        domain = request.ip  # Using 'ip' field for domain
        logger.info(f"Blocking domain {domain} for reason: {request.reason}")
        
        # Resolve domain to IP addresses
        try:
            ip_addresses = []
            # Try to get all IP addresses for the domain
            addr_info = socket.getaddrinfo(domain, None)
            for info in addr_info:
                ip = info[4][0]
                if ip not in ip_addresses:
                    ip_addresses.append(ip)
            
            if not ip_addresses:
                logger.warning(f"Could not resolve domain {domain} to any IP addresses")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Could not resolve domain '{domain}'. Please verify the domain name."
                )
            
            logger.info(f"Resolved {domain} to {len(ip_addresses)} IP address(es): {ip_addresses}")
            
        except socket.gaierror as e:
            logger.error(f"DNS resolution failed for {domain}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to resolve domain '{domain}': {str(e)}"
            )
        
        # Block each resolved IP address
        blocked_ips = []
        failed_ips = []
        
        for ip in ip_addresses:
            rule_name = f"Block {domain} ({ip}) - {request.reason}"
            command = [
                'netsh', 'advfirewall', 'firewall', 'add', 'rule',
                f'name={rule_name}',
                'dir=out',
                'action=block',
                f'remoteip={ip}'
            ]
            
            try:
                result = subprocess.run(command, capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    blocked_ips.append(ip)
                    logger.info(f"Successfully blocked IP {ip} for domain {domain}")
                else:
                    error_msg = result.stderr.strip() or result.stdout.strip() or "Unknown error"
                    failed_ips.append(f"{ip}: {error_msg}")
                    logger.error(f"Failed to block IP {ip} for {domain}: {error_msg}")
                    
                    # Check for permission issues
                    if "access is denied" in error_msg.lower() or "requested operation requires elevation" in error_msg.lower():
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Insufficient privileges. Please run the backend as Administrator to manage firewall rules."
                        )
            
            except subprocess.TimeoutExpired:
                failed_ips.append(f"{ip}: Timeout")
                logger.error(f"Timeout blocking IP {ip} for domain {domain}")
        
        # Return result based on success rate
        if blocked_ips and not failed_ips:
            return BlockIPResponse(
                success=True,
                message=f"Domain {domain} blocked successfully ({len(blocked_ips)} IP(s) blocked)",
                ip=domain
            )
        elif blocked_ips and failed_ips:
            logger.warning(f"Partially blocked {domain}: {len(blocked_ips)} succeeded, {len(failed_ips)} failed")
            return BlockIPResponse(
                success=True,
                message=f"Partially blocked {domain}. {len(blocked_ips)} IP(s) blocked, {len(failed_ips)} failed.",
                ip=domain
            )
        else:
            error_details = "; ".join(failed_ips)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to block domain {domain}. Errors: {error_details}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error blocking domain {domain}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to block domain: {str(e)}"
        )


@router.post(
    "/unblock",
    status_code=status.HTTP_200_OK,
    summary="Unblock IP or domain",
    description="Remove a firewall block rule for an IP address or domain"
)
async def unblock_resource(request: BlockIPRequest):
    """
    Remove a firewall blocking rule.
    
    Args:
        request: BlockIPRequest with IP/domain to unblock
        
    Returns:
        dict: Operation result
    """
    try:
        if platform.system() != "Windows":
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Firewall management only supported on Windows"
            )
        
        target = request.ip
        logger.info(f"Attempting to unblock {target}")
        
        # First, get all firewall rules
        show_command = [
            'netsh', 'advfirewall', 'firewall', 'show', 'rule',
            'name=all', 'dir=out'
        ]
        
        result = subprocess.run(show_command, capture_output=True, text=True, timeout=15)
        
        if result.returncode != 0:
            logger.error(f"Failed to list firewall rules: {result.stderr}")
            return {
                "success": False,
                "message": "Failed to list firewall rules",
                "target": target
            }
        
        # Parse output to find rules containing the target
        rules_to_delete = []
        lines = result.stdout.split('\n')
        
        for line in lines:
            line = line.strip()
            # Look for rule name lines
            if line.startswith('Rule Name:'):
                rule_name = line.split('Rule Name:', 1)[1].strip()
                # Check if this rule is one of our blocking rules for this target
                if 'Block' in rule_name and target in rule_name:
                    rules_to_delete.append(rule_name)
        
        if not rules_to_delete:
            logger.warning(f"No blocking rules found for {target}")
            return {
                "success": False,
                "message": f"No blocking rule found for {target}",
                "target": target
            }
        
        # Delete each rule
        deleted_count = 0
        failed_count = 0
        
        for rule_name in rules_to_delete:
            delete_command = [
                'netsh', 'advfirewall', 'firewall', 'delete', 'rule',
                f'name={rule_name}'
            ]
            
            del_result = subprocess.run(delete_command, capture_output=True, text=True, timeout=10)
            
            if del_result.returncode == 0:
                deleted_count += 1
                logger.info(f"Deleted firewall rule: {rule_name}")
            else:
                failed_count += 1
                logger.error(f"Failed to delete rule '{rule_name}': {del_result.stderr}")
        
        if deleted_count > 0:
            logger.info(f"Successfully unblocked {target} ({deleted_count} rule(s) deleted)")
            return {
                "success": True,
                "message": f"Successfully unblocked {target} ({deleted_count} rule(s) removed)",
                "target": target,
                "deleted_count": deleted_count
            }
        else:
            return {
                "success": False,
                "message": f"Failed to delete rules for {target}",
                "target": target
            }
            
    except subprocess.TimeoutExpired:
        logger.error(f"Timeout while unblocking {target}")
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Operation timed out"
        )
    except Exception as e:
        logger.error(f"Error unblocking resource: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unblock: {str(e)}"
        )


@router.get(
    "/rules",
    summary="List firewall blocking rules",
    description="Get list of all active firewall blocking rules created by this system"
)
async def list_blocking_rules():
    """
    List all blocking rules created by this system.
    
    Returns:
        dict: List of active blocking rules
    """
    try:
        if platform.system() != "Windows":
            return {
                "status": "unsupported",
                "rules": [],
                "message": "Firewall management only supported on Windows"
            }
        
        # Show firewall rules with "Block" in the name
        command = [
            'netsh', 'advfirewall', 'firewall', 'show', 'rule',
            'name=all', 'dir=out'
        ]
        
        result = subprocess.run(command, capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            # Parse output to find "Block" rules
            rules = []
            lines = result.stdout.split('\n')
            current_rule = {}
            
            for line in lines:
                line = line.strip()
                if line.startswith('Rule Name:'):
                    rule_name = line.split(':', 1)[1].strip()
                    if 'Block' in rule_name:
                        current_rule = {'name': rule_name}
                elif line.startswith('RemoteIP:') and current_rule:
                    current_rule['target'] = line.split(':', 1)[1].strip()
                    rules.append(current_rule)
                    current_rule = {}
            
            return {
                "status": "success",
                "rules": rules,
                "count": len(rules)
            }
        else:
            return {
                "status": "error",
                "rules": [],
                "message": "Failed to retrieve firewall rules"
            }
            
    except Exception as e:
        logger.error(f"Error listing rules: {str(e)}")
        return {
            "status": "error",
            "rules": [],
            "message": f"Error: {str(e)}"
        }


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