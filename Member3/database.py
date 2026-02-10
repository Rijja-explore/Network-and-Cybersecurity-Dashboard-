"""
Database module for SQLite operations.
Handles connection management, table creation, and database operations.
"""
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
from config import settings


class Database:
    """SQLite database manager for the monitoring system."""
    
    def __init__(self, db_path: str = None):
        """
        Initialize database connection.
        
        Args:
            db_path: Path to SQLite database file. Uses config default if not provided.
        """
        self.db_path = db_path or settings.DATABASE_PATH
        self.init_database()
    
    @contextmanager
    def get_connection(self):
        """
        Context manager for database connections.
        Ensures proper connection handling and cleanup.
        
        Yields:
            sqlite3.Connection: Database connection object
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def init_database(self):
        """
        Initialize database tables if they don't exist.
        Creates activities and alerts tables with proper schema.
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Create activities table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hostname TEXT NOT NULL,
                    bytes_sent INTEGER NOT NULL,
                    bytes_recv INTEGER NOT NULL,
                    process_list TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
            """)
            
            # Create index on hostname and timestamp for faster queries
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_activities_hostname 
                ON activities(hostname)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_activities_timestamp 
                ON activities(timestamp)
            """)
            
            # Create alerts table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hostname TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    activity_id INTEGER,
                    status TEXT NOT NULL DEFAULT 'active',
                    timestamp TEXT NOT NULL,
                    resolved_at TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (activity_id) REFERENCES activities (id)
                )
            """)
            
            # Create index on status for faster active alerts query
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_alerts_status 
                ON alerts(status)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_alerts_timestamp 
                ON alerts(timestamp)
            """)
            
            conn.commit()
    
    def insert_activity(
        self, 
        hostname: str, 
        bytes_sent: int, 
        bytes_recv: int, 
        processes: List[str]
    ) -> int:
        """
        Insert a new activity record.
        
        Args:
            hostname: Student machine hostname
            bytes_sent: Bytes sent by the machine
            bytes_recv: Bytes received by the machine
            processes: List of running process names
        
        Returns:
            int: ID of the inserted activity record
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            timestamp = datetime.utcnow().isoformat()
            process_list_json = json.dumps(processes)
            
            cursor.execute("""
                INSERT INTO activities (hostname, bytes_sent, bytes_recv, process_list, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (hostname, bytes_sent, bytes_recv, process_list_json, timestamp))
            
            return cursor.lastrowid
    
    def insert_alert(
        self, 
        hostname: str, 
        reason: str, 
        severity: str = "medium",
        activity_id: Optional[int] = None
    ) -> int:
        """
        Insert a new alert record.
        
        Args:
            hostname: Student machine hostname
            reason: Description of the policy violation
            severity: Alert severity level (low, medium, high, critical)
            activity_id: Associated activity record ID
        
        Returns:
            int: ID of the inserted alert record
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            timestamp = datetime.utcnow().isoformat()
            
            cursor.execute("""
                INSERT INTO alerts (hostname, reason, severity, activity_id, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (hostname, reason, severity, activity_id, timestamp))
            
            return cursor.lastrowid
    
    def get_all_alerts(self) -> List[Dict[str, Any]]:
        """
        Retrieve all alerts from the database.
        
        Returns:
            List of alert dictionaries with all fields
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, hostname, reason, severity, status, 
                       timestamp, resolved_at, activity_id
                FROM alerts
                ORDER BY timestamp DESC
            """)
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """
        Retrieve only active (unresolved) alerts.
        
        Returns:
            List of active alert dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, hostname, reason, severity, status, 
                       timestamp, resolved_at, activity_id
                FROM alerts
                WHERE status = 'active'
                ORDER BY timestamp DESC
            """)
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def resolve_alert(self, alert_id: int) -> bool:
        """
        Mark an alert as resolved.
        
        Args:
            alert_id: ID of the alert to resolve
        
        Returns:
            bool: True if alert was resolved, False if not found
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            resolved_at = datetime.utcnow().isoformat()
            
            cursor.execute("""
                UPDATE alerts
                SET status = 'resolved', resolved_at = ?
                WHERE id = ? AND status = 'active'
            """, (resolved_at, alert_id))
            
            return cursor.rowcount > 0
    
    def get_weekly_stats(self) -> Dict[str, Any]:
        """
        Calculate weekly statistics from activities and alerts.
        
        Returns:
            Dictionary containing weekly statistics
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get total bandwidth for the last 7 days
            cursor.execute("""
                SELECT 
                    COALESCE(SUM(bytes_sent), 0) as total_sent,
                    COALESCE(SUM(bytes_recv), 0) as total_recv,
                    COUNT(DISTINCT hostname) as active_students
                FROM activities
                WHERE datetime(timestamp) >= datetime('now', '-7 days')
            """)
            
            bandwidth_row = cursor.fetchone()
            
            # Get top bandwidth consumers
            cursor.execute("""
                SELECT 
                    hostname,
                    SUM(bytes_sent) as total_sent,
                    SUM(bytes_recv) as total_recv,
                    SUM(bytes_sent + bytes_recv) as total_bandwidth
                FROM activities
                WHERE datetime(timestamp) >= datetime('now', '-7 days')
                GROUP BY hostname
                ORDER BY total_bandwidth DESC
                LIMIT 10
            """)
            
            top_hosts = [dict(row) for row in cursor.fetchall()]
            
            # Get alert count for the last 7 days
            cursor.execute("""
                SELECT COUNT(*) as alert_count
                FROM alerts
                WHERE datetime(timestamp) >= datetime('now', '-7 days')
            """)
            
            alert_row = cursor.fetchone()
            
            # Get alert breakdown by severity
            cursor.execute("""
                SELECT severity, COUNT(*) as count
                FROM alerts
                WHERE datetime(timestamp) >= datetime('now', '-7 days')
                GROUP BY severity
            """)
            
            alerts_by_severity = {row['severity']: row['count'] for row in cursor.fetchall()}
            
            return {
                'total_bytes_sent': bandwidth_row['total_sent'],
                'total_bytes_recv': bandwidth_row['total_recv'],
                'total_bandwidth': bandwidth_row['total_sent'] + bandwidth_row['total_recv'],
                'active_students': bandwidth_row['active_students'],
                'top_bandwidth_hosts': top_hosts,
                'alert_count': alert_row['alert_count'],
                'alerts_by_severity': alerts_by_severity
            }
    
    def get_activity_by_id(self, activity_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific activity record by ID.
        
        Args:
            activity_id: ID of the activity record
        
        Returns:
            Activity dictionary or None if not found
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, hostname, bytes_sent, bytes_recv, process_list, timestamp
                FROM activities
                WHERE id = ?
            """, (activity_id,))
            
            row = cursor.fetchone()
            if row:
                activity = dict(row)
                activity['process_list'] = json.loads(activity['process_list'])
                return activity
            return None


# Global database instance
db = Database()
