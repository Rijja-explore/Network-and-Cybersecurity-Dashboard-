"""
Analytics Service
=================
Provides data aggregation and analytics calculations from monitoring.db

This service replaces the missing analytics.py from reports_analytics module
and connects to the real database instead of using mock data.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import db


def calculate_summary() -> Dict[str, Any]:
    """
    Calculate summary analytics from database.
    
    Returns:
        Dictionary with analytics metrics including:
        - total_alerts: Total number of alerts
        - alerts_by_severity: Breakdown by severity level
        - active_users: Count of unique active students
        - total_bandwidth_mb: Total bandwidth usage
        - avg_bandwidth_mb: Average bandwidth per session
        - top_applications: Most used applications
    """
    try:
        # Query real database
        activities = db.get_recent_activities(limit=1000)
        alerts = db.get_recent_alerts(limit=100)
        
        # Calculate bandwidth metrics
        total_bandwidth_mb = 0
        for activity in activities:
            bytes_total = activity.get('bytes_sent', 0) + activity.get('bytes_recv', 0)
            total_bandwidth_mb += bytes_total / (1024 * 1024)
        
        # Get unique students
        unique_students = len(set(a['student_id'] for a in activities if a.get('student_id')))
        
        # Alert breakdown by severity
        alert_counts = defaultdict(int)
        for alert in alerts:
            severity = alert.get('severity', 'info')
            alert_counts[severity] += 1
        
        # Top applications
        app_usage = defaultdict(int)
        for activity in activities:
            process_list = activity.get('process_list', [])
            if isinstance(process_list, list):
                for process in process_list[:5]:  # Top 5 apps per activity
                    if isinstance(process, dict):
                        app_name = process.get('name', 'Unknown')
                        app_usage[app_name] += 1
        
        top_apps = sorted(
            [{"name": app, "usage": count} for app, count in app_usage.items()],
            key=lambda x: x['usage'],
            reverse=True
        )[:10]
        
        return {
            "total_alerts": len(alerts),
            "alerts_by_severity": {
                "critical": alert_counts.get('critical', 0),
                "warning": alert_counts.get('warning', 0),
                "info": alert_counts.get('info', 0)
            },
            "active_users": unique_students,
            "total_bandwidth_mb": round(total_bandwidth_mb, 2),
            "avg_bandwidth_mb": round(total_bandwidth_mb / len(activities), 2) if activities else 0,
            "top_applications": top_apps
        }
    except Exception as e:
        print(f"Error calculating summary: {e}")
        # Return default structure
        return {
            "total_alerts": 0,
            "alerts_by_severity": {
                "critical": 0,
                "warning": 0,
                "info": 0
            },
            "active_users": 0,
            "total_bandwidth_mb": 0,
            "avg_bandwidth_mb": 0,
            "top_applications": []
        }


def get_network_chart_data() -> Dict[str, Any]:
    """
    Get network usage data formatted for frontend charts.
    
    Returns:
        Dictionary with chart-ready data:
        - time_series: Bandwidth over time (for line charts)
        - per_student: Bandwidth per student (for bar charts)
        - hourly_pattern: Usage by hour (for area charts)
    """
    try:
        activities = db.get_recent_activities(limit=1000)
        
        # Time series data (daily)
        daily_data = defaultdict(float)
        for activity in activities:
            date = activity['timestamp'][:10]  # Get YYYY-MM-DD
            bytes_total = activity.get('bytes_sent', 0) + activity.get('bytes_recv', 0)
            bandwidth_mb = bytes_total / (1024 * 1024)
            daily_data[date] += bandwidth_mb
        
        time_series = [
            {"timestamp": date, "bandwidth": round(bw, 2)}
            for date, bw in sorted(daily_data.items())
        ]
        
        # Per-student bandwidth
        student_data = defaultdict(float)
        for activity in activities:
            student_id = activity.get('student_id', 'Unknown')
            bytes_total = activity.get('bytes_sent', 0) + activity.get('bytes_recv', 0)
            bandwidth_mb = bytes_total / (1024 * 1024)
            student_data[student_id] += bandwidth_mb
        
        per_student = [
            {"student_id": sid, "bandwidth": round(bw, 2)}
            for sid, bw in sorted(student_data.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Hourly pattern
        hourly_data = defaultdict(float)
        for activity in activities:
            try:
                timestamp = datetime.fromisoformat(activity['timestamp'])
                hour = timestamp.hour
                bytes_total = activity.get('bytes_sent', 0) + activity.get('bytes_recv', 0)
                bandwidth_mb = bytes_total / (1024 * 1024)
                hourly_data[hour] += bandwidth_mb
            except:
                pass
        
        hourly_pattern = [
            {"hour": hour, "bandwidth": round(bw, 2)}
            for hour, bw in sorted(hourly_data.items())
        ]
        
        return {
            "time_series": time_series,
            "per_student": per_student,
            "hourly_pattern": hourly_pattern,
            "chart_config": {
                "time_series_label": "Daily Bandwidth Usage",
                "per_student_label": "Top Bandwidth Consumers",
                "hourly_label": "Hourly Usage Pattern"
            }
        }
    except Exception as e:
        print(f"Error getting network chart data: {e}")
        return {
            "time_series": [],
            "per_student": [],
            "hourly_pattern": [],
            "chart_config": {}
        }


def get_alerts_chart_data() -> Dict[str, Any]:
    """
    Get alerts data formatted for frontend charts.
    
    Returns:
        Dictionary with chart-ready data:
        - by_severity: Alert counts by severity (for pie/donut charts)
        - by_type: Alert counts by violation type (for bar charts)
        - daily_trend: Alerts over time (for line charts)
        - recent_alerts: Latest 5 alerts
    """
    try:
        alerts = db.get_recent_alerts(limit=500)
        
        # By severity
        severity_counts = defaultdict(int)
        for alert in alerts:
            severity = alert.get('severity', 'info')
            severity_counts[severity] += 1
        
        by_severity = [
            {"severity": sev, "count": count}
            for sev, count in severity_counts.items()
        ]
        
        # By violation type
        type_counts = defaultdict(int)
        for alert in alerts:
            violation_type = alert.get('violation_type', 'unknown')
            type_counts[violation_type] += 1
        
        by_type = [
            {"type": typ, "count": count}
            for typ, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Daily trend
        daily_alerts = defaultdict(int)
        for alert in alerts:
            try:
                date = alert['timestamp'][:10]
                daily_alerts[date] += 1
            except:
                pass
        
        daily_trend = [
            {"date": date, "count": count}
            for date, count in sorted(daily_alerts.items())
        ]
        
        # Recent alerts (latest 5)
        recent_alerts = sorted(
            alerts,
            key=lambda x: x.get('timestamp', ''),
            reverse=True
        )[:5]
        
        return {
            "by_severity": by_severity,
            "by_type": by_type,
            "daily_trend": daily_trend,
            "recent_alerts": recent_alerts,
            "total_alerts": len(alerts)
        }
    except Exception as e:
        print(f"Error getting alerts chart data: {e}")
        return {
            "by_severity": [],
            "by_type": [],
            "daily_trend": [],
            "recent_alerts": [],
            "total_alerts": 0
        }


def get_activity_data_from_db(start_date: Optional[datetime] = None, 
                               end_date: Optional[datetime] = None) -> List[Dict]:
    """
    Get activity data from database with optional date filtering.
    
    Args:
        start_date: Optional start date for filtering
        end_date: Optional end date for filtering
        
    Returns:
        List of activity records
    """
    try:
        activities = db.get_recent_activities(limit=10000)
        
        if start_date or end_date:
            filtered_activities = []
            for activity in activities:
                try:
                    activity_date = datetime.fromisoformat(activity['timestamp'])
                    if start_date and activity_date < start_date:
                        continue
                    if end_date and activity_date > end_date:
                        continue
                    filtered_activities.append(activity)
                except:
                    pass
            return filtered_activities
        
        return activities
    except Exception as e:
        print(f"Error getting activity data: {e}")
        return []


def get_alerts_data_from_db(start_date: Optional[datetime] = None,
                            end_date: Optional[datetime] = None) -> List[Dict]:
    """
    Get alerts data from database with optional date filtering.
    
    Args:
        start_date: Optional start date for filtering
        end_date: Optional end date for filtering
        
    Returns:
        List of alert records
    """
    try:
        alerts = db.get_recent_alerts(limit=10000)
        
        if start_date or end_date:
            filtered_alerts = []
            for alert in alerts:
                try:
                    alert_date = datetime.fromisoformat(alert['timestamp'])
                    if start_date and alert_date < start_date:
                        continue
                    if end_date and alert_date > end_date:
                        continue
                    filtered_alerts.append(alert)
                except:
                    pass
            return filtered_alerts
        
        return alerts
    except Exception as e:
        print(f"Error getting alerts data: {e}")
        return []
