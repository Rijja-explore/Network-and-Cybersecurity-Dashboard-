#!/usr/bin/env python3
"""
QUICK SYSTEM STATUS CHECK
Diagnoses why "confirm block" may not be working
"""
import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = "app.db"

print("=" * 70)
print("🔍 SYSTEM STATUS CHECK")
print("=" * 70)

# Check 1: Database exists
if os.path.exists(DB_PATH):
    print(f"\n✅ Database found: {DB_PATH}")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"   Tables: {', '.join(t[0] for t in tables)}")
        
        # Check recent commands
        cursor.execute("""
            SELECT id, student_id, action, domain, status, created_at, executed_at
            FROM commands
            ORDER BY created_at DESC
            LIMIT 5
        """)
        commands = cursor.fetchall()
        
        if commands:
            print(f"\n📋 Recent Commands (Last 5):")
            for cmd in commands:
                cmd_id, student, action, domain, status, created, executed = cmd
                print(f"   [{cmd_id}] {action} on {domain}")
                print(f"       Student: {student}")
                print(f"       Status: {status}")
                print(f"       Created: {created}")
                if executed:
                    print(f"       Executed: {executed} ✅")
                else:
                    print(f"       Executed: Pending ⏳")
        else:
            print("\n⚠️  No commands in database")
            print("   → Block commands may not have been created yet")
        
        # Check recent activities
        cursor.execute("""
            SELECT COUNT(*) FROM activities
            WHERE created_at > datetime('now', '-10 minutes')
        """)
        recent_activity = cursor.fetchone()[0]
        
        if recent_activity > 0:
            print(f"\n✅ Recent Activity: {recent_activity} events in last 10 minutes")
            print("   → Student agents ARE sending data")
        else:
            print(f"\n❌ No Activity: No events in last 10 minutes")
            print("   → Student agents may NOT be running")
            print("   → Start with: python student_agent.py")
        
        # Check pending commands for agents
        cursor.execute("""
            SELECT student_id, COUNT(*) FROM commands
            WHERE status = 'pending'
            GROUP BY student_id
        """)
        pending = cursor.fetchall()
        if pending:
            print(f"\n📤 Pending Commands Waiting for Agents:")
            for student, count in pending:
                print(f"   {student}: {count} pending command(s)")
                print(f"   → Agent needs to poll /commands?student_id={student}")
        
        conn.close()
        
    except Exception as e:
        print(f"   ❌ Error reading database: {e}")
else:
    print(f"\n❌ Database NOT found: {DB_PATH}")
    print("   The app needs to be initialized")

print("\n" + "=" * 70)
print("💡 TROUBLESHOOTING")
print("=" * 70)
print("""
If "Confirm Block" doesn't work:

1. ❌ No recent activity? 
   → Start student agent: python student_agent.py
   
2. ❌ Commands are 'pending' after 5+ seconds?
   → Agent isn't polling /commands
   → Make sure BACKEND_SERVER_PORT = 8000 in student_agent.py
   → Check agent console for connection errors
   
3. ❌ Block command never created?
   → Admin dashboard not sending block request
   → Check browser console for errors
   → Ensure /admin/block-domain endpoint works

4. ✅ All systems working?
   → Blocks will execute on agent machine:
      - Windows Firewall rule added
      - hosts file entry created
      - Domain resolves to 127.0.0.1
""")
print("=" * 70)
