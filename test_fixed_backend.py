#!/usr/bin/env python3
"""
Test the fixed backend on port 8001
"""

import json
import socket
from urllib.request import urlopen, Request
from datetime import datetime
import time

# Test the NEW backend on port 8001
BACKEND_URL = "http://localhost:8001/activity"
ADMIN_URL = "http://localhost:8001/admin/logs"

def test_new_backend():
    """Test the new backend with the database fix"""
    
    # Send a test record
    data = {
        "hostname": "FIXED-TEST-PC",
        "timestamp": datetime.now().isoformat(),
        "bytes_sent": 3000000,
        "bytes_recv": 7000000,  
        "cpu_percent": 55.0,
        "memory_percent": 70.0,
        "disk_percent": 80.0,
        "active_connections": 15,
        "upload_rate_kbps": 100.0,
        "download_rate_kbps": 200.0,
        "processes": ["chrome.exe", "vscode.exe", "teams.exe"],
        "destinations": [
            {"ip": "8.8.8.8", "port": 53, "domain": "google.com"},
            {"ip": "1.1.1.1", "port": 443, "domain": "cloudflare.com"}
        ]
    }
    
    try:
        # Send data
        json_data = json.dumps(data).encode('utf-8')
        req = Request(BACKEND_URL, data=json_data, headers={'Content-Type': 'application/json'})
        response = urlopen(req, timeout=5)
        response_data = json.loads(response.read().decode('utf-8'))
        
        print(f"✅ Data sent successfully! Activity ID: {response_data.get('activity_id')}")
        
        # Wait and check results
        time.sleep(2)
        
        # Check admin logs
        req2 = Request(ADMIN_URL)
        response2 = urlopen(req2, timeout=5)
        logs = json.loads(response2.read().decode('utf-8'))
        
        print(f"✅ Retrieved {len(logs)} student records:")
        for i, log in enumerate(logs[:3], 1):
            hostname = log.get('hostname', 'Unknown')
            cpu = log.get('cpu', 0)
            memory = log.get('memory', 0)
            timestamp = log.get('timestamp', 'Unknown')
            print(f"  {i}. {hostname} - CPU: {cpu}%, Memory: {memory}%, Time: {timestamp}")
            
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    print("=== Testing Fixed Backend (Port 8001) ===")
    test_new_backend()
    print("=== Test Complete ===")