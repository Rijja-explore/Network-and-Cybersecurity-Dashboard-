"""
Authentication router - Handles admin login and JWT token management.
Integrates Member 1's authentication system with proper API structure.
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
    responses={
        401: {"description": "Unauthorized"},
        422: {"description": "Validation error"}
    }
)

# For demo purposes - in production, use proper JWT tokens and hashed passwords
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"


class LoginRequest(BaseModel):
    """Request model for admin login."""
    username: str = Field(..., description="Admin username")
    password: str = Field(..., description="Admin password")


class LoginResponse(BaseModel):
    """Response model for successful login."""
    success: bool = Field(..., description="Login success status")
    token: str = Field(..., description="Authentication token")
    username: str = Field(..., description="Authenticated username")
    message: str = Field(..., description="Success message")


def authenticate(username: str, password: str) -> bool:
    """
    Authenticate admin credentials.
    
    Args:
        username: Admin username
        password: Admin password
        
    Returns:
        bool: True if authentication successful
    """
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin login",
    description="""
    Authenticate admin user and receive access token.
    
    **Default Credentials**:
    - Username: admin
    - Password: admin123
    
    **Note**: This is a demo authentication system.
    In production, implement proper JWT tokens and password hashing.
    """
)
async def login(request: LoginRequest) -> LoginResponse:
    """
    Authenticate admin user.
    
    Args:
        request: LoginRequest containing username and password
        
    Returns:
        LoginResponse: Authentication token and user info
        
    Raises:
        HTTPException: If credentials are invalid
    """
    try:
        logger.info(f"Login attempt for username: {request.username}")
        
        if authenticate(request.username, request.password):
            # In production, generate proper JWT token here
            token = f"admin-token-{request.username}-demo"
            
            logger.info(f"Successful login for username: {request.username}")
            return LoginResponse(
                success=True,
                token=token,
                username=request.username,
                message="Login successful"
            )
        else:
            logger.warning(f"Failed login attempt for username: {request.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login for username {request.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication"
        )


@router.post(
    "/logout",
    summary="Admin logout",
    description="Logout admin user (for completeness - token validation would be implemented in production)"
)
async def logout():
    """
    Logout admin user.
    
    Returns:
        dict: Logout confirmation
    """
    return {
        "success": True,
        "message": "Logout successful"
    }


@router.get(
    "/verify",
    summary="Verify token",
    description="Verify if authentication token is valid"
)
async def verify_token():
    """
    Verify authentication token.
    
    Returns:
        dict: Token verification result
    """
    # In production, validate JWT token here
    return {
        "success": True,
        "valid": True,
        "message": "Token is valid"
    }