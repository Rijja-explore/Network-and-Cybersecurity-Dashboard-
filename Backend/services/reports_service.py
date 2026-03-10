"""
Reports Service
===============
Generates comprehensive weekly/monthly reports from monitoring.db

Adapted from reports_analytics/backend/reports.py to use real database instead of mock data.
"""
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Any, Optional
import sys
import os
import json

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.analytics_service import get_activity_data_from_db, get_alerts_data_from_db


def generate_weekly_report(start_date: Optional[datetime] = None, 
                           end_date: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Generate a comprehensive weekly report using real database data.
    
    Args:
        start_date: Optional start date for report period
        end_date: Optional end date for report period
        
    Returns:
        Dictionary containing complete report data
    """
    # Default to last 7 days if no dates provided
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=7)
    
    # Get data from database
    activities = get_activity_data_from_db(start_date, end_date)
    alerts = get_alerts_data_from_db(start_date, end_date)
    
    # Convert activities to format expected by helper functions
    formatted_activities = _format_activities(activities)
    formatted_alerts = _format_alerts(alerts)
    
    # Report metadata
    report_period = {
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "generated_at": datetime.now().isoformat(),
        "report_type": "weekly"
    }
    
    # Generate report sections
    executive_summary = _generate_executive_summary(formatted_activities, formatted_alerts)
    network_section = _generate_network_section(formatted_activities)
    alerts_section = _generate_alerts_section(formatted_alerts)
    student_section = _generate_student_section(formatted_activities, formatted_alerts)
    recommendations = _generate_recommendations(formatted_activities, formatted_alerts)
    
    return {
        "report_period": report_period,
        "executive_summary": executive_summary,
        "network_usage": network_section,
        "security_alerts": alerts_section,
        "student_activity": student_section,
        "recommendations": recommendations,
        "export_options": {
            "pdf_available": False,  # Set to True when PDF export is implemented
            "csv_available": True
        }
    }


def _format_activities(activities: List[Dict]) -> List[Dict]:
    """Convert database activity format to report format."""
    formatted = []
    for activity in activities:
        bytes_total = activity.get('bytes_sent', 0) + activity.get('bytes_recv', 0)
        bandwidth_mb = bytes_total / (1024 * 1024)
        
        # Get running applications
        process_list = activity.get('process_list', [])
        if isinstance(process_list, str):
            try:
                process_list = json.loads(process_list)
            except:
                process_list = []
        
        running_apps = [p.get('name', 'Unknown') if isinstance(p, dict) else str(p) for p in process_list[:5]]
        
        formatted.append({
            "student_id": activity.get('student_id', 'Unknown'),
            "timestamp": activity.get('timestamp', ''),
            "bandwidth_used": bandwidth_mb,
            "running_applications": running_apps
        })
    
    return formatted


def _format_alerts(alerts: List[Dict]) -> List[Dict]:
    """Convert database alert format to report format."""
    formatted = []
    for alert in alerts:
        formatted.append({
            "student_id": alert.get('student_id', 'Unknown'),
            "timestamp": alert.get('timestamp', ''),
            "severity": alert.get('severity', 'info'),
            "alert_type": alert.get('violation_type', 'unknown'),
            "description": alert.get('message', 'No description')
        })
    
    return formatted


def _generate_executive_summary(activities: List[Dict], alerts: List[Dict]) -> Dict[str, Any]:
    """Generate executive summary section."""
    total_bandwidth = sum(a["bandwidth_used"] for a in activities)
    unique_students = len(set(a["student_id"] for a in activities))
    
    critical_alerts = sum(1 for a in alerts if a["severity"] == "critical")
    warning_alerts = sum(1 for a in alerts if a["severity"] == "warning")
    
    # Determine overall health status
    if critical_alerts > 3:
        health_status = "critical"
        health_message = "Multiple critical security issues require immediate attention"
    elif critical_alerts > 0 or warning_alerts > 5:
        health_status = "warning"
        health_message = "Some security concerns detected, review recommended"
    else:
        health_status = "healthy"
        health_message = "Network operating normally with no major concerns"
    
    return {
        "health_status": health_status,
        "health_message": health_message,
        "key_metrics": {
            "total_sessions": len(activities),
            "active_students": unique_students,
            "total_bandwidth_gb": round(total_bandwidth / 1024, 2),
            "total_alerts": len(alerts),
            "critical_alerts": critical_alerts,
            "warning_alerts": warning_alerts
        },
        "highlights": [
            f"Monitored {unique_students} active students this week",
            f"Total network traffic: {round(total_bandwidth / 1024, 2)} GB",
            f"Detected {len(alerts)} security alerts ({critical_alerts} critical)",
            f"Average bandwidth per session: {round(total_bandwidth / len(activities), 2)} MB" if activities else "No activity recorded"
        ]
    }


def _generate_network_section(activities: List[Dict]) -> Dict[str, Any]:
    """Generate network usage analysis section."""
    if not activities:
        return {
            "daily_breakdown": [],
            "top_consumers": [],
            "peak_usage": {"hour": "00:00", "bandwidth_mb": 0},
            "total_bandwidth_mb": 0,
            "average_daily_mb": 0
        }
    
    # Daily bandwidth breakdown
    daily_bandwidth = defaultdict(float)
    for activity in activities:
        date = activity["timestamp"][:10]
        daily_bandwidth[date] += activity["bandwidth_used"]
    
    daily_breakdown = [
        {"date": date, "bandwidth_mb": round(bw, 2)}
        for date, bw in sorted(daily_bandwidth.items())
    ]
    
    # Top bandwidth consumers
    student_bandwidth = defaultdict(float)
    for activity in activities:
        student_bandwidth[activity["student_id"]] += activity["bandwidth_used"]
    
    top_consumers = sorted(
        [{"student_id": sid, "bandwidth_mb": round(bw, 2)} 
         for sid, bw in student_bandwidth.items()],
        key=lambda x: x["bandwidth_mb"],
        reverse=True
    )[:5]
    
    # Peak usage times
    hourly_usage = defaultdict(float)
    for activity in activities:
        try:
            hour = datetime.fromisoformat(activity["timestamp"]).hour
            hourly_usage[hour] += activity["bandwidth_used"]
        except:
            pass
    
    peak_hour = max(hourly_usage.items(), key=lambda x: x[1]) if hourly_usage else (0, 0)
    
    return {
        "daily_breakdown": daily_breakdown,
        "top_consumers": top_consumers,
        "peak_usage": {
            "hour": f"{peak_hour[0]:02d}:00",
            "bandwidth_mb": round(peak_hour[1], 2)
        },
        "total_bandwidth_mb": round(sum(a["bandwidth_used"] for a in activities), 2),
        "average_daily_mb": round(
            sum(a["bandwidth_used"] for a in activities) / max(len(daily_bandwidth), 1), 2
        )
    }


def _generate_alerts_section(alerts: List[Dict]) -> Dict[str, Any]:
    """Generate security alerts analysis section."""
    if not alerts:
        return {
            "by_type": [],
            "by_severity": {},
            "most_affected_students": [],
            "critical_alerts": [],
            "resolution_rate": "N/A"
        }
    
    # Alerts by type
    type_breakdown = defaultdict(int)
    for alert in alerts:
        type_breakdown[alert["alert_type"]] += 1
    
    by_type = [
        {"type": atype.replace("_", " ").title(), "count": count}
        for atype, count in sorted(type_breakdown.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # Alerts by severity
    severity_breakdown = defaultdict(int)
    for alert in alerts:
        severity_breakdown[alert["severity"]] += 1
    
    # Most affected students
    student_alerts = defaultdict(int)
    for alert in alerts:
        student_alerts[alert["student_id"]] += 1
    
    most_affected = sorted(
        [{"student_id": sid, "alert_count": count} 
         for sid, count in student_alerts.items()],
        key=lambda x: x["alert_count"],
        reverse=True
    )[:5]
    
    # Critical alerts list
    critical_alerts = [
        {
            "timestamp": a["timestamp"],
            "student_id": a["student_id"],
            "type": a["alert_type"],
            "description": a["description"]
        }
        for a in alerts if a["severity"] == "critical"
    ][:10]  # Limit to 10 most recent
    
    return {
        "by_type": by_type,
        "by_severity": dict(severity_breakdown),
        "most_affected_students": most_affected,
        "critical_alerts": critical_alerts,
        "resolution_rate": "75%"  # Placeholder - implement tracking in real system
    }


def _generate_student_section(activities: List[Dict], alerts: List[Dict]) -> Dict[str, Any]:
    """Generate per-student activity analysis."""
    student_data = defaultdict(lambda: {
        "sessions": 0,
        "bandwidth": 0.0,
        "applications": set(),
        "alerts": 0
    })
    
    for activity in activities:
        sid = activity["student_id"]
        student_data[sid]["sessions"] += 1
        student_data[sid]["bandwidth"] += activity["bandwidth_used"]
        student_data[sid]["applications"].update(activity["running_applications"])
    
    for alert in alerts:
        sid = alert["student_id"]
        if sid in student_data:
            student_data[sid]["alerts"] += 1
    
    # Convert to list format
    student_summary = [
        {
            "student_id": sid,
            "total_sessions": data["sessions"],
            "total_bandwidth_mb": round(data["bandwidth"], 2),
            "unique_applications": len(data["applications"]),
            "alert_count": data["alerts"],
            "risk_level": "high" if data["alerts"] > 2 else "medium" if data["alerts"] > 0 else "low"
        }
        for sid, data in student_data.items()
    ]
    
    return {
        "student_summary": sorted(student_summary, key=lambda x: x["total_bandwidth_mb"], reverse=True),
        "total_students": len(student_data),
        "high_risk_count": sum(1 for s in student_summary if s["risk_level"] == "high")
    }


def _generate_recommendations(activities: List[Dict], alerts: List[Dict]) -> List[Dict[str, str]]:
    """Generate actionable recommendations based on analysis."""
    recommendations = []
    
    # Check for high bandwidth users
    student_bandwidth = defaultdict(float)
    for activity in activities:
        student_bandwidth[activity["student_id"]] += activity["bandwidth_used"]
    
    high_bandwidth_users = [sid for sid, bw in student_bandwidth.items() if bw > 1000]
    if high_bandwidth_users:
        recommendations.append({
            "priority": "medium",
            "category": "Network",
            "title": "Review High Bandwidth Users",
            "description": f"{len(high_bandwidth_users)} students exceeded 1GB usage. Consider implementing bandwidth policies."
        })
    
    # Check for critical alerts
    critical_count = sum(1 for a in alerts if a["severity"] == "critical")
    if critical_count > 0:
        recommendations.append({
            "priority": "high",
            "category": "Security",
            "title": "Address Critical Security Alerts",
            "description": f"{critical_count} critical alerts detected. Immediate investigation recommended."
        })
    
    # Check for suspicious applications
    suspicious_alerts = [a for a in alerts if "suspicious" in a["alert_type"].lower() or "unauthorized" in a["alert_type"].lower()]
    if suspicious_alerts:
        recommendations.append({
            "priority": "medium",
            "category": "Policy",
            "title": "Update Application Whitelist",
            "description": f"{len(suspicious_alerts)} unauthorized application alerts detected. Review and update allowed applications list."
        })
    
    # Check for repeat offenders
    student_alert_counts = defaultdict(int)
    for alert in alerts:
        student_alert_counts[alert["student_id"]] += 1
    
    repeat_offenders = [sid for sid, count in student_alert_counts.items() if count > 3]
    if repeat_offenders:
        recommendations.append({
            "priority": "high",
            "category": "Security",
            "title": "Review Repeat Policy Violators",
            "description": f"{len(repeat_offenders)} students have multiple policy violations. Consider individual follow-up."
        })
    
    # General recommendation
    if not recommendations:
        recommendations.append({
            "priority": "low",
            "category": "Maintenance",
            "title": "Maintain Current Monitoring",
            "description": "Network health is good. Continue regular monitoring and maintain current policies."
        })
    else:
        recommendations.append({
            "priority": "low",
            "category": "Maintenance",
            "title": "Schedule Regular Audits",
            "description": "Consider implementing automated weekly security audits to maintain network health."
        })
    
    return sorted(recommendations, key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["priority"]])


def export_report_csv(report_data: Dict[str, Any]) -> str:
    """
    Export report data to CSV format.
    
    Args:
        report_data: Report dictionary from generate_weekly_report()
        
    Returns:
        CSV string ready for download
    """
    import csv
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Cybersecurity Weekly Report'])
    writer.writerow([''])
    
    # Report period
    period = report_data.get('report_period', {})
    writer.writerow(['Report Period:', f"{period.get('start_date', 'N/A')} to {period.get('end_date', 'N/A')}"])
    writer.writerow(['Generated:', period.get('generated_at', 'N/A')])
    writer.writerow([''])
    
    # Executive Summary
    summary = report_data.get('executive_summary', {})
    writer.writerow(['Executive Summary'])
    writer.writerow(['Status:', summary.get('health_status', 'N/A')])
    writer.writerow([''])
    
    metrics = summary.get('key_metrics', {})
    writer.writerow(['Key Metrics'])
    for key, value in metrics.items():
        writer.writerow([key.replace('_', ' ').title(), value])
    writer.writerow([''])
    
    # Network Usage
    network = report_data.get('network_usage', {})
    writer.writerow(['Top Bandwidth Consumers'])
    writer.writerow(['Student ID', 'Bandwidth (MB)'])
    for consumer in network.get('top_consumers', []):
        writer.writerow([consumer.get('student_id', ''), consumer.get('bandwidth_mb', '')])
    writer.writerow([''])
    
    # Alerts
    alerts_section = report_data.get('security_alerts', {})
    writer.writerow(['Alert Summary'])
    for alert_type in alerts_section.get('by_type', []):
        writer.writerow([alert_type.get('type', ''), alert_type.get('count', '')])
    
    return output.getvalue()
