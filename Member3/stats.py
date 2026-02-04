"""
Statistics calculation engine.
Generates weekly analytics and chart-ready data for the admin dashboard.
"""
from typing import Dict, Any, List
from datetime import datetime
from database import db
from models import WeeklyStatsResponse, BandwidthHostStats


class StatisticsEngine:
    """
    Calculates network statistics and analytics.
    Provides React-friendly, chart-ready data structures.
    """
    
    def __init__(self):
        """Initialize the statistics engine."""
        self.db = db
    
    def calculate_weekly_stats(self) -> WeeklyStatsResponse:
        """
        Calculate comprehensive weekly statistics.
        
        Returns data optimized for frontend charts and dashboards:
        - Total bandwidth usage (bytes, MB, GB)
        - Number of active students
        - Alert counts and breakdown
        - Top bandwidth-consuming hosts
        
        Returns:
            WeeklyStatsResponse: Comprehensive weekly statistics
        """
        # Get raw statistics from database
        raw_stats = self.db.get_weekly_stats()
        
        # Convert bytes to MB and GB for easier reading
        total_bandwidth_bytes = raw_stats['total_bandwidth']
        total_bandwidth_mb = total_bandwidth_bytes / (1024 * 1024)
        total_bandwidth_gb = total_bandwidth_bytes / (1024 * 1024 * 1024)
        
        # Convert top hosts to proper model format
        top_hosts = [
            BandwidthHostStats(
                hostname=host['hostname'],
                total_sent=host['total_sent'],
                total_recv=host['total_recv'],
                total_bandwidth=host['total_bandwidth']
            )
            for host in raw_stats['top_bandwidth_hosts']
        ]
        
        # Ensure all severity levels are present in alerts breakdown
        alerts_by_severity = {
            'low': 0,
            'medium': 0,
            'high': 0,
            'critical': 0
        }
        alerts_by_severity.update(raw_stats['alerts_by_severity'])
        
        return WeeklyStatsResponse(
            period="Last 7 days",
            total_bytes_sent=raw_stats['total_bytes_sent'],
            total_bytes_recv=raw_stats['total_bytes_recv'],
            total_bandwidth=total_bandwidth_bytes,
            total_bandwidth_mb=round(total_bandwidth_mb, 2),
            total_bandwidth_gb=round(total_bandwidth_gb, 4),
            active_students=raw_stats['active_students'],
            alert_count=raw_stats['alert_count'],
            alerts_by_severity=alerts_by_severity,
            top_bandwidth_hosts=top_hosts,
            generated_at=datetime.utcnow().isoformat()
        )
    
    def get_bandwidth_summary(self) -> Dict[str, Any]:
        """
        Get a simple bandwidth summary for quick dashboard display.
        
        Returns:
            dict: Simplified bandwidth statistics
        """
        stats = self.db.get_weekly_stats()
        
        total_bandwidth_gb = stats['total_bandwidth'] / (1024 * 1024 * 1024)
        
        return {
            'total_gb': round(total_bandwidth_gb, 2),
            'active_students': stats['active_students'],
            'avg_gb_per_student': round(
                total_bandwidth_gb / stats['active_students'] if stats['active_students'] > 0 else 0,
                2
            )
        }
    
    def get_top_consumers(self, limit: int = 10) -> List[BandwidthHostStats]:
        """
        Get top bandwidth-consuming hosts.
        
        Args:
            limit: Maximum number of hosts to return
        
        Returns:
            List of top bandwidth consumers
        """
        stats = self.db.get_weekly_stats()
        
        top_hosts = stats['top_bandwidth_hosts'][:limit]
        
        return [
            BandwidthHostStats(
                hostname=host['hostname'],
                total_sent=host['total_sent'],
                total_recv=host['total_recv'],
                total_bandwidth=host['total_bandwidth']
            )
            for host in top_hosts
        ]
    
    def get_alert_summary(self) -> Dict[str, Any]:
        """
        Get alert statistics summary.
        
        Returns:
            dict: Alert statistics including counts and breakdowns
        """
        stats = self.db.get_weekly_stats()
        
        total_alerts = stats['alert_count']
        by_severity = stats['alerts_by_severity']
        
        # Calculate percentages
        severity_percentages = {}
        if total_alerts > 0:
            for severity, count in by_severity.items():
                severity_percentages[severity] = round((count / total_alerts) * 100, 1)
        else:
            severity_percentages = {k: 0 for k in by_severity.keys()}
        
        return {
            'total_alerts': total_alerts,
            'alerts_by_severity': by_severity,
            'severity_percentages': severity_percentages
        }


# Global statistics engine instance
stats_engine = StatisticsEngine()
