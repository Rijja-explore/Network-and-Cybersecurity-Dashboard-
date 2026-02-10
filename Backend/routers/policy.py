"""
Policy router - Manages network access policies and domain lists.
Allows admin to configure allowed/blocked domains and view policy settings.
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List
import logging
import json
import os

from config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/policy",
    tags=["Policy Management"],
    responses={
        404: {"description": "Not found"},
        422: {"description": "Validation error"}
    }
)

# Policy storage file
POLICY_FILE = os.path.join(os.path.dirname(settings.DATABASE_PATH), "policies.json")


class DomainPolicy(BaseModel):
    """Model for domain policy entry."""
    domain: str = Field(..., description="Domain name", examples=["facebook.com"])
    policy: str = Field(..., description="Policy type: 'blocked' or 'allowed'", examples=["blocked"])
    reason: str = Field(default="", description="Reason for the policy")
    added_by: str = Field(default="admin", description="Admin who added the policy")


class PolicyListResponse(BaseModel):
    """Response model for policy list."""
    allowed_domains: List[str]
    blocked_domains: List[str]
    blocked_keywords: List[str]
    bandwidth_threshold_mb: int


def load_policies() -> dict:
    """Load policies from file."""
    if os.path.exists(POLICY_FILE):
        try:
            with open(POLICY_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading policies: {e}")
            return {"allowed_domains": [], "blocked_domains": []}
    return {"allowed_domains": [], "blocked_domains": []}


def save_policies(policies: dict):
    """Save policies to file."""
    try:
        with open(POLICY_FILE, 'w') as f:
            json.dump(policies, f, indent=2)
        logger.info("Policies saved successfully")
    except Exception as e:
        logger.error(f"Error saving policies: {e}")
        raise


@router.get(
    "/domains",
    response_model=PolicyListResponse,
    summary="Get domain policies",
    description="Retrieve current allowed and blocked domain lists with policy settings"
)
async def get_domain_policies() -> PolicyListResponse:
    """
    Get current domain policies.
    
    Returns:
        PolicyListResponse: Current policy configuration
    """
    try:
        policies = load_policies()
        
        return PolicyListResponse(
            allowed_domains=policies.get("allowed_domains", []),
            blocked_domains=policies.get("blocked_domains", []),
            blocked_keywords=settings.BLOCKED_KEYWORDS,
            bandwidth_threshold_mb=settings.BANDWIDTH_THRESHOLD_MB
        )
    except Exception as e:
        logger.error(f"Error retrieving policies: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve policies: {str(e)}"
        )


@router.post(
    "/domains/block",
    status_code=status.HTTP_201_CREATED,
    summary="Add domain to block list",
    description="Add a domain to the blocked domains list"
)
async def add_blocked_domain(domain_policy: DomainPolicy):
    """
    Add a domain to the blocked list.
    
    Args:
        domain_policy: Domain policy with domain name and reason
        
    Returns:
        dict: Operation result
    """
    try:
        policies = load_policies()
        
        if "blocked_domains" not in policies:
            policies["blocked_domains"] = []
        
        domain = domain_policy.domain.lower().strip()
        
        if domain in policies["blocked_domains"]:
            return {
                "success": False,
                "message": f"Domain {domain} is already blocked",
                "domain": domain
            }
        
        policies["blocked_domains"].append(domain)
        save_policies(policies)
        
        logger.info(f"Added {domain} to blocked domains list")
        
        return {
            "success": True,
            "message": f"Domain {domain} added to block list",
            "domain": domain,
            "total_blocked": len(policies["blocked_domains"])
        }
        
    except Exception as e:
        logger.error(f"Error adding blocked domain: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add blocked domain: {str(e)}"
        )


@router.post(
    "/domains/allow",
    status_code=status.HTTP_201_CREATED,
    summary="Add domain to allow list",
    description="Add a domain to the allowed domains list (whitelist)"
)
async def add_allowed_domain(domain_policy: DomainPolicy):
    """
    Add a domain to the allowed list.
    
    Args:
        domain_policy: Domain policy with domain name
        
    Returns:
        dict: Operation result
    """
    try:
        policies = load_policies()
        
        if "allowed_domains" not in policies:
            policies["allowed_domains"] = []
        
        domain = domain_policy.domain.lower().strip()
        
        if domain in policies["allowed_domains"]:
            return {
                "success": False,
                "message": f"Domain {domain} is already allowed",
                "domain": domain
            }
        
        # Remove from blocked if present
        if "blocked_domains" in policies and domain in policies["blocked_domains"]:
            policies["blocked_domains"].remove(domain)
            logger.info(f"Removed {domain} from blocked list")
        
        policies["allowed_domains"].append(domain)
        save_policies(policies)
        
        logger.info(f"Added {domain} to allowed domains list")
        
        return {
            "success": True,
            "message": f"Domain {domain} added to allow list",
            "domain": domain,
            "total_allowed": len(policies["allowed_domains"])
        }
        
    except Exception as e:
        logger.error(f"Error adding allowed domain: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add allowed domain: {str(e)}"
        )


@router.delete(
    "/domains/{domain}",
    summary="Remove domain from policies",
    description="Remove a domain from both allowed and blocked lists"
)
async def remove_domain_policy(domain: str):
    """
    Remove a domain from all policy lists.
    
    Args:
        domain: Domain name to remove
        
    Returns:
        dict: Operation result
    """
    try:
        policies = load_policies()
        domain = domain.lower().strip()
        removed_from = []
        
        if domain in policies.get("allowed_domains", []):
            policies["allowed_domains"].remove(domain)
            removed_from.append("allowed")
        
        if domain in policies.get("blocked_domains", []):
            policies["blocked_domains"].remove(domain)
            removed_from.append("blocked")
        
        if removed_from:
            save_policies(policies)
            logger.info(f"Removed {domain} from {', '.join(removed_from)} lists")
            
            return {
                "success": True,
                "message": f"Domain {domain} removed from {', '.join(removed_from)} lists",
                "domain": domain
            }
        else:
            return {
                "success": False,
                "message": f"Domain {domain} not found in any policy list",
                "domain": domain
            }
            
    except Exception as e:
        logger.error(f"Error removing domain policy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove domain policy: {str(e)}"
        )


@router.get(
    "/summary",
    summary="Get policy summary",
    description="Get summary of current policy configuration"
)
async def get_policy_summary():
    """
    Get summary statistics of current policies.
    
    Returns:
        dict: Policy summary with counts and settings
    """
    try:
        policies = load_policies()
        
        return {
            "allowed_domains_count": len(policies.get("allowed_domains", [])),
            "blocked_domains_count": len(policies.get("blocked_domains", [])),
            "blocked_keywords_count": len(settings.BLOCKED_KEYWORDS),
            "bandwidth_threshold_mb": settings.BANDWIDTH_THRESHOLD_MB,
            "policies_active": True
        }
        
    except Exception as e:
        logger.error(f"Error getting policy summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get policy summary: {str(e)}"
        )
