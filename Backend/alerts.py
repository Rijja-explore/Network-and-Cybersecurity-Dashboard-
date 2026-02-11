"""
Policy violation detection engine.
Checks activities against security policies and generates violation reports.
"""
from typing import List, Dict, Any
from models import ViolationResult
from config import settings
import json
import os


# Suspicious domains that might indicate security risks
SUSPICIOUS_DOMAINS = [
    'torrent', 'proxy', 'vpn', 'darkweb', 'hack', 'crack', 
    'pirate', 'download', 'streaming', 'gaming'
]


class PolicyViolationDetector:
    """
    Detects policy violations based on process names, bandwidth usage, network destinations, and CPU usage.
    This is a legal monitoring system for network administration purposes.
    """
    
    def __init__(self):
        """Initialize the detector with all thresholds from configuration."""
        self.blocked_keywords = [kw.strip().lower() for kw in settings.BLOCKED_KEYWORDS]
        self.bandwidth_threshold_bytes = settings.BANDWIDTH_THRESHOLD_MB * 1024 * 1024
        self.cpu_threshold = settings.CPU_THRESHOLD_PERCENT
        self.memory_threshold = settings.MEMORY_THRESHOLD_PERCENT
        self.disk_threshold = settings.DISK_THRESHOLD_PERCENT
        self.max_connections = settings.CONNECTIONS_THRESHOLD
        self.upload_rate_threshold_kbps = settings.UPLOAD_RATE_THRESHOLD_MBPS * 1024
        self.download_rate_threshold_kbps = settings.DOWNLOAD_RATE_THRESHOLD_MBPS * 1024
    
    def check_violations(
        self, 
        processes: List[str], 
        bytes_sent: int, 
        bytes_recv: int,
        hostname: str,
        destinations: List[Dict[str, Any]] = None,
        cpu_percent: float = None,
        memory_percent: float = None,
        disk_percent: float = None,
        active_connections: int = None,
        upload_rate_kbps: float = None,
        download_rate_kbps: float = None
    ) -> ViolationResult:
        """
        Check if activity violates any policies.
        
        Violations occur when:
        1. Any running process contains a blocked keyword in its name
        2. Bandwidth usage exceeds the configured threshold
        3. Accessing suspicious or unauthorized domains
        4. Excessive network connections
        5. High CPU usage (potential mining or resource abuse)
        6. High memory usage (potential memory leak or abuse)
        7. High disk usage (potential data hording or abuse)
        8. Excessive upload/download rates (potential data exfiltration)
        
        Args:
            processes: List of running process names (should be lowercase)
            bytes_sent: Total bytes sent by the machine
            bytes_recv: Total bytes received by the machine
            hostname: Machine hostname (for logging purposes)
            destinations: List of network destinations with IP, port, domain
            cpu_percent: Current CPU usage percentage
            memory_percent: Current memory usage percentage
            disk_percent: Current disk usage percentage
            active_connections: Number of active network connections
            upload_rate_kbps: Current upload rate in KB/s
            download_rate_kbps: Current download rate in KB/s
        
        Returns:
            ViolationResult: Contains violation status, reason, and details
        """
        violations = []
        max_severity = "low"
        violated_processes = []
        
        # Check for blocked processes
        process_violation = self._check_blocked_processes(processes)
        if process_violation['violation']:
            violations.append(process_violation['reason'])
            violated_processes.extend(process_violation['violated_processes'])
            max_severity = self._escalate_severity(max_severity, "high")
        
        # Check for bandwidth violations
        bandwidth_violation = self._check_bandwidth_threshold(bytes_sent, bytes_recv)
        if bandwidth_violation['violation']:
            violations.append(bandwidth_violation['reason'])
            max_severity = self._escalate_severity(max_severity, "medium")
        
        # Check for suspicious domains
        if destinations:
            domain_violation = self._check_suspicious_domains(destinations)
            if domain_violation['violation']:
                violations.append(domain_violation['reason'])
                max_severity = self._escalate_severity(max_severity, "high")
        
        # Check for excessive connections
        if destinations and len(destinations) > self.max_connections:
            violations.append(f"Excessive network connections detected: {len(destinations)} active connections (limit: {self.max_connections})")
            max_severity = self._escalate_severity(max_severity, "medium")
        
        # Check for high CPU usage
        if cpu_percent is not None and cpu_percent > self.cpu_threshold:
            violations.append(f"High CPU usage detected: {cpu_percent:.1f}% (threshold: {self.cpu_threshold}%)")
            max_severity = self._escalate_severity(max_severity, "medium")
        
        # Check for high memory usage
        if memory_percent is not None and memory_percent > self.memory_threshold:
            violations.append(f"High memory usage detected: {memory_percent:.1f}% (threshold: {self.memory_threshold}%)")
            max_severity = self._escalate_severity(max_severity, "medium")
        
        # Check for high disk usage
        if disk_percent is not None and disk_percent > self.disk_threshold:
            violations.append(f"High disk usage detected: {disk_percent:.1f}% (threshold: {self.disk_threshold}%)")
            max_severity = self._escalate_severity(max_severity, "medium")
        
        # Check for excessive upload rate
        if upload_rate_kbps is not None and upload_rate_kbps > self.upload_rate_threshold_kbps:
            violations.append(f"Excessive upload rate detected: {upload_rate_kbps:.1f} KB/s (threshold: {self.upload_rate_threshold_kbps/1024:.1f} MB/s)")
            max_severity = self._escalate_severity(max_severity, "high")
        
        # Check for excessive download rate
        if download_rate_kbps is not None and download_rate_kbps > self.download_rate_threshold_kbps:
            violations.append(f"Excessive download rate detected: {download_rate_kbps:.1f} KB/s (threshold: {self.download_rate_threshold_kbps/1024:.1f} MB/s)")
            max_severity = self._escalate_severity(max_severity, "medium")
        
        # Combine all violations
        if violations:
            return ViolationResult(
                violation=True,
                reason="; ".join(violations),
                severity=max_severity,
                violated_processes=violated_processes
            )
        else:
            return ViolationResult(
                violation=False,
                reason=None,
                severity="low",
                violated_processes=[]
            )
    
    def _escalate_severity(self, current: str, new: str) -> str:
        """
        Escalate severity level if new severity is higher.
        
        Args:
            current: Current severity level
            new: New severity level to compare
        
        Returns:
            Highest severity level
        """
        severity_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        if severity_order.get(new, 0) > severity_order.get(current, 0):
            return new
        return current
    
    def _check_suspicious_domains(self, destinations: List[Dict[str, Any]]) -> dict:
        """
        Check if any network destination is suspicious.
        
        Args:
            destinations: List of network destinations with domain info
        
        Returns:
            dict: Violation status and details
        """
        suspicious_found = []
        
        for dest in destinations:
            domain = dest.get('domain', '').lower()
            if domain:
                for keyword in SUSPICIOUS_DOMAINS:
                    if keyword in domain:
                        suspicious_found.append(domain)
                        break
        
        # Load blocked domains from policy
        blocked_domains = self._load_blocked_domains()
        for dest in destinations:
            domain = dest.get('domain', '').lower()
            if domain in blocked_domains:
                suspicious_found.append(f"{domain} (blocked policy)")
        
        if suspicious_found:
            domains_str = ", ".join(set(suspicious_found[:3]))  # Show first 3
            count = len(set(suspicious_found))
            return {
                'violation': True,
                'reason': f"Suspicious/blocked domain access detected: {domains_str}" + (f" (+{count-3} more)" if count > 3 else "")
            }
        
        return {'violation': False, 'reason': None}
    
    def _load_blocked_domains(self) -> List[str]:
        """Load blocked domains from policy file."""
        policy_file = os.path.join(os.path.dirname(settings.DATABASE_PATH), "policies.json")
        if os.path.exists(policy_file):
            try:
                with open(policy_file, 'r') as f:
                    policies = json.load(f)
                    return policies.get('blocked_domains', [])
            except Exception:
                return []
        return []
    
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
