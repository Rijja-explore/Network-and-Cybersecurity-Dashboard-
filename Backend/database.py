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
                    website_list TEXT,
                    destinations TEXT,
                    agent_timestamp TEXT,
                    timestamp TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
            """)
            
            # Migrate existing tables - add new columns if they don't exist
            self._migrate_activities_table(cursor)
            
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
            
            # Create commands table for remote student control
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS commands (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    domain TEXT,
                    reason TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    executed_at TEXT
                )
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_commands_student_status 
                ON commands(student_id, status)
            """)
            
            conn.commit()
    
    def _migrate_activities_table(self, cursor):
        """
        Migrate activities table to add new columns if they don't exist.
        
        Args:
            cursor: Database cursor
        """
        # Get existing columns
        cursor.execute("PRAGMA table_info(activities)")
        existing_columns = {row[1] for row in cursor.fetchall()}
        
        # Add missing columns
        if 'website_list' not in existing_columns:
            print("📦 Migrating database: Adding 'website_list' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN website_list TEXT")
        
        if 'destinations' not in existing_columns:
            print("📦 Migrating database: Adding 'destinations' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN destinations TEXT")
        
        if 'cpu_percent' not in existing_columns:
            print("📦 Migrating database: Adding 'cpu_percent' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN cpu_percent REAL")
        
        if 'memory_percent' not in existing_columns:
            print("📦 Migrating database: Adding 'memory_percent' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN memory_percent REAL")
        
        if 'disk_percent' not in existing_columns:
            print("📦 Migrating database: Adding 'disk_percent' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN disk_percent REAL")
        
        if 'active_connections' not in existing_columns:
            print("📦 Migrating database: Adding 'active_connections' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN active_connections INTEGER")
        
        if 'upload_rate_kbps' not in existing_columns:
            print("📦 Migrating database: Adding 'upload_rate_kbps' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN upload_rate_kbps REAL")
        
        if 'download_rate_kbps' not in existing_columns:
            print("📦 Migrating database: Adding 'download_rate_kbps' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN download_rate_kbps REAL")
        
        if 'agent_timestamp' not in existing_columns:
            print("📦 Migrating database: Adding 'agent_timestamp' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN agent_timestamp TEXT")
    
    def insert_activity(
        self, 
        hostname: str, 
        bytes_sent: int, 
        bytes_recv: int, 
        processes: List[str],
        websites: List[str] = None,
        destinations: List[Dict[str, Any]] = None,
        agent_timestamp: str = None,
        cpu_percent: float = None,
        memory_percent: float = None,
        disk_percent: float = None,
        active_connections: int = None,
        upload_rate_kbps: float = None,
        download_rate_kbps: float = None
    ) -> int:
        """
        Insert a new activity record.
        
        Args:
            hostname: Student machine hostname
            bytes_sent: Bytes sent by the machine
            bytes_recv: Bytes received by the machine
            processes: List of running process names
            websites: List of websites/domains accessed (legacy)
            destinations: List of network destinations (IP, port, domain)
            agent_timestamp: Timestamp from student agent
            cpu_percent: CPU usage percentage (0-100)
            memory_percent: Memory usage percentage (0-100)
            disk_percent: Disk usage percentage (0-100)
            active_connections: Number of active network connections
            upload_rate_kbps: Upload rate in KB/s
            download_rate_kbps: Download rate in KB/s
        
        Returns:
            int: ID of the inserted activity record
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            timestamp = datetime.utcnow().isoformat()
            process_list_json = json.dumps(processes)
            website_list_json = json.dumps(websites or [])
            destinations_json = json.dumps(destinations or [])
            
            cursor.execute("""
                INSERT INTO activities (
                    hostname, bytes_sent, bytes_recv, process_list, website_list, 
                    destinations, agent_timestamp, cpu_percent, memory_percent, 
                    disk_percent, active_connections, upload_rate_kbps, download_rate_kbps, timestamp
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                hostname, bytes_sent, bytes_recv, process_list_json, website_list_json, 
                destinations_json, agent_timestamp, cpu_percent, memory_percent, 
                disk_percent, active_connections, upload_rate_kbps, download_rate_kbps, timestamp
            ))
            
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

    def get_recent_activities(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Retrieve recent activity records for admin dashboard.
        
        Args:
            limit: Maximum number of records to return
        
        Returns:
            List of recent activity dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, hostname, bytes_sent, bytes_recv, process_list, website_list, destinations, agent_timestamp, cpu_percent, timestamp
                FROM activities
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))
            
            rows = cursor.fetchall()
            activities = []
            for row in rows:
                activity = dict(row)
                # Parse JSON fields safely
                process_list = activity.get('process_list', '[]')
                activity['process_list'] = json.loads(process_list) if isinstance(process_list, str) else process_list
                
                website_list = activity.get('website_list', '[]')
                activity['website_list'] = json.loads(website_list) if isinstance(website_list, str) else (website_list or [])
                
                destinations = activity.get('destinations', '[]')
                activity['destinations'] = json.loads(destinations) if isinstance(destinations, str) else (destinations or [])
                
                activities.append(activity)
            
            return activities
    
    def add_command(
        self,
        student_id: str,
        action: str,
        domain: str = None,
        reason: str = None
    ) -> int:
        """
        Add a command for a student agent to execute.
        
        Args:
            student_id: Student hostname/ID
            action: Command action (e.g., BLOCK_DOMAIN, UNBLOCK_DOMAIN)
            domain: Domain/IP to target
            reason: Reason for the command
        
        Returns:
            int: Command ID
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO commands (student_id, action, domain, reason, status)
                VALUES (?, ?, ?, ?, 'pending')
            """, (student_id, action, domain, reason))
            return cursor.lastrowid
    
    def get_pending_commands(self, student_id: str) -> List[Dict[str, Any]]:
        """
        Get pending commands for a specific student.
        
        Args:
            student_id: Student hostname/ID
        
        Returns:
            List of pending command dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, student_id, action, domain, reason, created_at
                FROM commands
                WHERE student_id = ? AND status = 'pending'
                ORDER BY created_at ASC
            """, (student_id,))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def mark_command_executed(self, command_id: int) -> bool:
        """
        Mark a command as executed.
        
        Args:
            command_id: Command ID
        
        Returns:
            bool: True if successful
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE commands
                SET status = 'executed', executed_at = datetime('now')
                WHERE id = ?
            """, (command_id,))
            return cursor.rowcount > 0
    
    def get_all_commands(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all commands for admin viewing.
        
        Args:
            limit: Maximum number of commands to return
        
        Returns:
            List of command dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, student_id, action, domain, reason, status, created_at, executed_at
                FROM commands
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]


    def get_currently_blocked_domains(self, student_id: str) -> list:
        """
        Returns a list of domains currently blocked for the student.
        A domain is considered blocked if the latest command for that domain is BLOCK_DOMAIN and not undone by a later UNBLOCK_DOMAIN.
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Get all commands for this student and domain, ordered by domain and created_at
            cursor.execute('''
                SELECT domain, action, MAX(created_at) as last_action_time
                FROM commands
                WHERE student_id = ? AND domain IS NOT NULL
                GROUP BY domain
            ''', (student_id,))
            rows = cursor.fetchall()
            blocked_domains = []
            for row in rows:
                domain = row[0]
                # Find the latest action for this domain
                cursor.execute('''
                    SELECT action FROM commands
                    WHERE student_id = ? AND domain = ?
                    ORDER BY created_at DESC LIMIT 1
                ''', (student_id, domain))
                last_action = cursor.fetchone()
                if last_action and last_action[0] == 'BLOCK_DOMAIN':
                    blocked_domains.append(domain)
            return blocked_domains
    
    def get_active_students(self, hours: int = 24) -> List[str]:
        """
        Get list of students active within the specified hours.
        
        Args:
            hours: Number of hours to look back for activity
        
        Returns:
            List of unique student hostnames
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT hostname
                FROM activities
                WHERE datetime(timestamp) >= datetime('now', '-' || ? || ' hours')
                ORDER BY hostname
            """, (hours,))
            
            rows = cursor.fetchall()
            return [row[0] for row in rows]
    
    def create_global_command(
        self,
        action: str,
        domain: str = None,
        reason: str = None,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Create a command for ALL active students.
        
        Args:
            action: Command action (e.g., BLOCK_DOMAIN, UNBLOCK_DOMAIN)
            domain: Domain to target
            reason: Reason for the command
            hours: Hours to look back for active students
        
        Returns:
            Dictionary with command creation results
        """
        active_students = self.get_active_students(hours)
        
        if not active_students:
            return {
                "success": False,
                "message": "No active students found",
                "commands_created": 0,
                "students": []
            }
        
        created_count = 0
        for student in active_students:
            self.add_command(student, action, domain, reason)
            created_count += 1
        
        return {
            "success": True,
            "message": f"Command sent to {created_count} student(s)",
            "commands_created": created_count,
            "students": active_students,
            "action": action,
            "domain": domain
        }

# Global database instance
db = Database()
