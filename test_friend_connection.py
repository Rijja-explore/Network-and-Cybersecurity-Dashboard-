#!/usr/bin/env python3
"""
Test connection to your backend from student agent
"""

import json
from urllib.request import urlopen, Request
from datetime import datetime
import time

# Your backend configuration
BACKEND_URL = "http://10.154.216.252:8001/activity"

def test_student_connection():
    """Test if student can connect to your backend"""
    
    data = {
        "hostname": "FRIEND-LAPTOP-01",
        "timestamp": datetime.now().isoformat(),
        "bytes_sent": 5000000,
        "bytes_recv": 15000000,
        "cpu_percent": 65.0,
        "memory_percent": 75.0,
        "disk_percent": 80.0,
        "active_connections": 12,
        "upload_rate_kbps": 125.0,
        "download_rate_kbps": 350.0,
        "processes": ["chrome.exe", "discord.exe", "spotify.exe", "steam.exe"],
        "destinations": [
            {"ip": "142.250.189.110", "port": 443, "domain": "youtube.com"},
            {"ip": "157.240.12.35", "port": 443, "domain": "instagram.com"},
            {"ip": "104.16.132.229", "port": 443, "domain": "discord.com"}
        ]
    }
    
    try:
        json_data = json.dumps(data).encode('utf-8')
        req = Request(
            BACKEND_URL, 
            data=json_data, 
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Testing connection to: {BACKEND_URL}")
        response = urlopen(req, timeout=10)
        response_data = json.loads(response.read().decode('utf-8'))
        
        print("✅ SUCCESS: Student agent can connect!")
        print(f"Response: Activity ID {response_data.get('activity_id')}")
        return True
        
    except Exception as e:
        print(f"❌ CONNECTION FAILED: {e}")
        print("\n🔧 Troubleshooting:")
        print(f"1. Make sure backend is running on {BACKEND_URL}")
        print("2. Check Windows Firewall settings")
        print("3. Verify your friend can ping your IP: 10.154.216.252")
        return False

if __name__ == "__main__":
    print("=== Testing Friend's Laptop Connection ===")
    test_student_connection()
    print("=== Test Complete ===")