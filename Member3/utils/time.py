"""
Time utility functions.
Provides helper functions for timestamp handling and date operations.
"""
from datetime import datetime, timedelta
from typing import Optional


def get_utc_now() -> datetime:
    """
    Get current UTC datetime.
    
    Returns:
        datetime: Current UTC time
    """
    return datetime.utcnow()


def get_utc_now_iso() -> str:
    """
    Get current UTC datetime in ISO format.
    
    Returns:
        str: Current UTC time in ISO 8601 format
    """
    return datetime.utcnow().isoformat()


def parse_iso_timestamp(timestamp: str) -> Optional[datetime]:
    """
    Parse ISO format timestamp string to datetime object.
    
    Args:
        timestamp: ISO format timestamp string
    
    Returns:
        datetime object or None if parsing fails
    """
    try:
        return datetime.fromisoformat(timestamp)
    except (ValueError, TypeError):
        return None


def get_week_ago() -> datetime:
    """
    Get datetime object for 7 days ago from now.
    
    Returns:
        datetime: Time 7 days ago
    """
    return datetime.utcnow() - timedelta(days=7)


def get_week_ago_iso() -> str:
    """
    Get ISO format timestamp for 7 days ago.
    
    Returns:
        str: ISO timestamp for 7 days ago
    """
    return get_week_ago().isoformat()


def format_timestamp(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Format datetime object to custom string format.
    
    Args:
        dt: Datetime object to format
        format_str: Format string (default: "YYYY-MM-DD HH:MM:SS")
    
    Returns:
        str: Formatted timestamp string
    """
    return dt.strftime(format_str)


def get_time_difference_minutes(start: datetime, end: datetime) -> int:
    """
    Calculate time difference in minutes between two datetimes.
    
    Args:
        start: Start datetime
        end: End datetime
    
    Returns:
        int: Difference in minutes
    """
    delta = end - start
    return int(delta.total_seconds() / 60)


def is_within_last_n_days(timestamp: str, days: int = 7) -> bool:
    """
    Check if a timestamp is within the last N days.
    
    Args:
        timestamp: ISO format timestamp string
        days: Number of days to check (default: 7)
    
    Returns:
        bool: True if timestamp is within last N days, False otherwise
    """
    dt = parse_iso_timestamp(timestamp)
    if not dt:
        return False
    
    cutoff = datetime.utcnow() - timedelta(days=days)
    return dt >= cutoff


def get_human_readable_time_ago(timestamp: str) -> str:
    """
    Convert timestamp to human-readable "time ago" format.
    
    Args:
        timestamp: ISO format timestamp string
    
    Returns:
        str: Human-readable time ago (e.g., "2 hours ago")
    """
    dt = parse_iso_timestamp(timestamp)
    if not dt:
        return "Unknown"
    
    now = datetime.utcnow()
    delta = now - dt
    
    seconds = int(delta.total_seconds())
    
    if seconds < 60:
        return f"{seconds} second{'s' if seconds != 1 else ''} ago"
    elif seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    else:
        days = seconds // 86400
        return f"{days} day{'s' if days != 1 else ''} ago"
