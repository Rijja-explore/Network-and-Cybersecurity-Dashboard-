"""
Policy violation detection engine.
Checks activities against security policies and generates violation reports.
"""
from typing import List
from models import ViolationResult
from config import settings


class PolicyViolationDetector:
    """
    Detects policy violations based on process names and bandwidth usage.
    This is a legal monitoring system for network administration purposes.
    """
    
    def __init__(self):
        """Initialize the detector with blocked keywords from configuration."""
        self.blocked_keywords = [kw.strip().lower() for kw in settings.BLOCKED_KEYWORDS]
        self.bandwidth_threshold_bytes = settings.BANDWIDTH_THRESHOLD_MB * 1024 * 1024
    
    def check_violations(
        self, 
        processes: List[str], 
        bytes_sent: int, 
        bytes_recv: int,
        hostname: str
    ) -> ViolationResult:
        """
        Check if activity violates any policies.
        
        Violations occur when:
        1. Any running process contains a blocked keyword in its name
        2. Bandwidth usage exceeds the configured threshold
        
        Args:
            processes: List of running process names (should be lowercase)
            bytes_sent: Total bytes sent by the machine
            bytes_recv: Total bytes received by the machine
            hostname: Machine hostname (for logging purposes)
        
        Returns:
            ViolationResult: Contains violation status, reason, and details
        """
        # Check for blocked processes
        process_violation = self._check_blocked_processes(processes)
        
        # Check for bandwidth violations
        bandwidth_violation = self._check_bandwidth_threshold(bytes_sent, bytes_recv)
        
        # Combine violations
        if process_violation['violation'] and bandwidth_violation['violation']:
            return ViolationResult(
                violation=True,
                reason=f"{process_violation['reason']}; {bandwidth_violation['reason']}",
                severity="critical",
                violated_processes=process_violation['violated_processes']
            )
        elif process_violation['violation']:
            return ViolationResult(
                violation=True,
                reason=process_violation['reason'],
                severity="high",
                violated_processes=process_violation['violated_processes']
            )
        elif bandwidth_violation['violation']:
            return ViolationResult(
                violation=True,
                reason=bandwidth_violation['reason'],
                severity="medium",
                violated_processes=[]
            )
        else:
            return ViolationResult(
                violation=False,
                reason=None,
                severity="low",
                violated_processes=[]
            )
    
    def _check_blocked_processes(self, processes: List[str]) -> dict:
        """
        Check if any running process matches blocked keywords.
        
        Args:
            processes: List of running process names (lowercase)
        
        Returns:
            dict: Violation status and details
        """
        violated_processes = []
        
        for process in processes:
            process_lower = process.lower()
            for keyword in self.blocked_keywords:
                if keyword in process_lower:
                    violated_processes.append(process)
                    break  # One match per process is enough
        
        if violated_processes:
            process_list = ", ".join(violated_processes)
            return {
                'violation': True,
                'reason': f"Blocked application detected: {process_list}",
                'violated_processes': violated_processes
            }
        
        return {
            'violation': False,
            'reason': None,
            'violated_processes': []
        }
    
    def _check_bandwidth_threshold(self, bytes_sent: int, bytes_recv: int) -> dict:
        """
        Check if bandwidth usage exceeds the threshold.
        
        Args:
            bytes_sent: Total bytes sent
            bytes_recv: Total bytes received
        
        Returns:
            dict: Violation status and details
        """
        total_bandwidth = bytes_sent + bytes_recv
        
        if total_bandwidth > self.bandwidth_threshold_bytes:
            mb_used = total_bandwidth / (1024 * 1024)
            mb_threshold = self.bandwidth_threshold_bytes / (1024 * 1024)
            
            return {
                'violation': True,
                'reason': f"Bandwidth threshold exceeded: {mb_used:.2f} MB (limit: {mb_threshold:.0f} MB)"
            }
        
        return {
            'violation': False,
            'reason': None
        }
    
    def is_process_blocked(self, process_name: str) -> bool:
        """
        Check if a single process name is blocked.
        
        Args:
            process_name: Name of the process to check
        
        Returns:
            bool: True if process is blocked, False otherwise
        """
        process_lower = process_name.lower()
        return any(keyword in process_lower for keyword in self.blocked_keywords)
    
    def get_blocked_keywords(self) -> List[str]:
        """
        Get the list of blocked keywords.
        
        Returns:
            List of blocked keywords
        """
        return self.blocked_keywords.copy()
    
    def get_bandwidth_threshold_mb(self) -> int:
        """
        Get the bandwidth threshold in megabytes.
        
        Returns:
            Bandwidth threshold in MB
        """
        return settings.BANDWIDTH_THRESHOLD_MB


# Global detector instance
detector = PolicyViolationDetector()
