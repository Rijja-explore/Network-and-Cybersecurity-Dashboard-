"""
Reports Module for Cybersecurity Monitoring Dashboard
=====================================================
Handles report generation logic for weekly/monthly reports.

INTEGRATION NOTES:
- Currently generates reports from mock data
- To add PDF export:
  1. Install reportlab or weasyprint
  2. Create PDF template
  3. Add /reports/weekly/pdf endpoint
- To connect to real database:
  1. Replace analytics imports with database queries
  2. Add date range filtering from actual timestamps
"""

from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Any

from analytics import get_activity_data, get_alerts_data


def generate_weekly_report() -> Dict[str, Any]:
    """
    Generate a comprehensive weekly report.
    
    INTEGRATION NOTE:
    When connecting to real backend, add date parameters:
    def generate_weekly_report(start_date: datetime, end_date: datetime)
    
    Returns structured data for frontend display.
    For PDF export, this same data structure can be used with a PDF template.
    """
    activities = get_activity_data()
    alerts = get_alerts_data()
    
    # Report metadata
    report_period = {
        "start_date": "2026-02-05",
        "end_date": "2026-02-11",
        "generated_at": datetime.now().isoformat(),
        "report_type": "weekly"
    }
    
    # Executive Summary
    executive_summary = _generate_executive_summary(activities, alerts)
    
    # Network Usage Section
    network_section = _generate_network_section(activities)
    
    # Security Alerts Section
    alerts_section = _generate_alerts_section(alerts)
    
    # Student Activity Section
    student_section = _generate_student_section(activities, alerts)
    
    # Recommendations
    recommendations = _generate_recommendations(activities, alerts)
    
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
        hour = datetime.fromisoformat(activity["timestamp"]).hour
        hourly_usage[hour] += activity["bandwidth_used"]
    
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
    ]
    
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
            "description": f"Students {', '.join(high_bandwidth_users)} exceeded 1GB usage. Consider implementing bandwidth policies."
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
    suspicious_alerts = [a for a in alerts if a["alert_type"] == "suspicious_application"]
    if suspicious_alerts:
        recommendations.append({
            "priority": "medium",
            "category": "Policy",
            "title": "Update Application Whitelist",
            "description": "Multiple unauthorized application alerts detected. Review and update allowed applications list."
        })
    
    # General recommendation
    recommendations.append({
        "priority": "low",
        "category": "Maintenance",
        "title": "Schedule Regular Audits",
        "description": "Consider implementing automated weekly security audits to maintain network health."
    })
    
    return sorted(recommendations, key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["priority"]])


def export_report_csv(report_data: Dict[str, Any]) -> str:
    """
    Generate CSV export of report data.
    
    INTEGRATION NOTE:
    This returns CSV as a string. In the actual endpoint,
    return as StreamingResponse with proper headers.
    """
    lines = []
    
    # Header
    lines.append("Network Health & Cybersecurity Weekly Report")
    lines.append(f"Period: {report_data['report_period']['start_date']} to {report_data['report_period']['end_date']}")
    lines.append("")
    
    # Executive Summary
    lines.append("EXECUTIVE SUMMARY")
    summary = report_data["executive_summary"]
    lines.append(f"Health Status,{summary['health_status']}")
    lines.append(f"Total Sessions,{summary['key_metrics']['total_sessions']}")
    lines.append(f"Active Students,{summary['key_metrics']['active_students']}")
    lines.append(f"Total Bandwidth (GB),{summary['key_metrics']['total_bandwidth_gb']}")
    lines.append(f"Total Alerts,{summary['key_metrics']['total_alerts']}")
    lines.append("")
    
    # Student Activity
    lines.append("STUDENT ACTIVITY")
    lines.append("Student ID,Sessions,Bandwidth (MB),Applications,Alerts,Risk Level")
    for student in report_data["student_activity"]["student_summary"]:
        lines.append(
            f"{student['student_id']},{student['total_sessions']},"
            f"{student['total_bandwidth_mb']},{student['unique_applications']},"
            f"{student['alert_count']},{student['risk_level']}"
        )
    
    return "\n".join(lines)
