#!/usr/bin/env python3
"""
Test the admin logs endpoint directly
"""

import json
from urllib.request import urlopen, Request

def test_admin_logs():
    """Test if admin logs endpoint works without JSON errors"""
    
    try:
        req = Request("http://10.154.216.252:8001/admin/logs")
        response = urlopen(req, timeout=5)
        logs = json.loads(response.read().decode('utf-8'))
        
        print(f"✅ SUCCESS: Retrieved {len(logs)} student records!")
        print("Students found:")
        
        for i, student in enumerate(logs, 1):
            hostname = student.get('hostname', 'Unknown')
            cpu = student.get('cpu', 0) 
            memory = student.get('memory', 0)
            apps = student.get('apps', [])
            network_mb = student.get('network_mb', 0)
            timestamp = student.get('timestamp', 'Unknown')
            
            print(f"  {i}. {hostname}")
            print(f"     CPU: {cpu}%, Memory: {memory}%, Network: {network_mb}MB")
            print(f"     Apps: {', '.join(apps[:3])}")
            print(f"     Last seen: {timestamp}")
            print()
            
        return len(logs) > 0
        
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

if __name__ == "__main__":
    print("=== Testing Admin Logs Endpoint ===")
    if test_admin_logs():
        print("🎯 Your dashboard should now show the student data!")
        print("📱 Check: http://localhost:3004/students")
    else:
        print("⚠️  Issue still exists with admin logs endpoint")