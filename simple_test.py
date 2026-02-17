#!/usr/bin/env python3
"""
Minimal test to send data to backend without dependencies
"""

import json
import socket
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from datetime import datetime
import time

# Configuration
BACKEND_URL = "http://localhost:8000/activity"
TEST_HOSTNAME = socket.gethostname()

def send_test_data():
    """Send minimal test data to backend"""
    
    data = {
        "hostname": TEST_HOSTNAME,
        "timestamp": datetime.now().isoformat(),
        "bytes_sent": 1000000,
        "bytes_recv": 2000000,  
        "cpu_percent": 45.5,
        "memory_percent": 65.0,
        "disk_percent": 75.0,
        "active_connections": 10,
        "upload_rate_kbps": 50.0,
        "download_rate_kbps": 100.0,
        "processes": ["chrome.exe", "notepad.exe"],
        "destinations": [
            {"ip": "8.8.8.8", "port": 53, "domain": "google.com"}
        ]
    }
    
    try:
        # Convert to JSON
        json_data = json.dumps(data).encode('utf-8')
        
        # Create request
        req = Request(
            BACKEND_URL, 
            data=json_data, 
            headers={'Content-Type': 'application/json'}
        )
        
        # Send request
        print(f"Sending test data for hostname: {TEST_HOSTNAME}")
        response = urlopen(req, timeout=5)
        
        # Read response
        response_data = json.loads(response.read().decode('utf-8'))
        
        print("✅ SUCCESS: Data sent successfully!")
        print("Response:", json.dumps(response_data, indent=2))
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def check_students():
    """Check if we can retrieve students data"""
    try:
        req = Request("http://localhost:8000/admin/logs")
        response = urlopen(req, timeout=5)
        data = json.loads(response.read().decode('utf-8'))
        
        print(f"✅ Retrieved {len(data)} student records")
        print("Current students:")
        for student in data:
            print(f"  - {student.get('hostname', 'Unknown')} (last seen: {student.get('timestamp', 'Unknown')})")
            
        return True
    except Exception as e:
        print(f"❌ ERROR checking students: {e}")
        return False

if __name__ == "__main__":
    print("=== Backend Connection Test ===")
    
    # Test sending data
    if send_test_data():
        print("\nWaiting 2 seconds...")
        time.sleep(2)
        
        # Test retrieving data
        check_students()
    
    print("\n=== Test Complete ===")