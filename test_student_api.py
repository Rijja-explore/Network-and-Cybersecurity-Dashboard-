#!/usr/bin/env python3
"""
Simple test script to send activity data to the backend
"""
import requests
import json
from datetime import datetime

# Backend URL
BACKEND_URL = "http://localhost:8000"

def test_send_activity():
    """Send test activity data to backend"""
    
    data = {
        "hostname": "TEST-PC-001",
        "timestamp": datetime.now().isoformat(),
        "bytes_sent": 1000000,
        "bytes_recv": 2000000,
        "cpu_percent": 45.5,
        "memory_percent": 65.0,
        "disk_percent": 75.0,
        "active_connections": 10,
        "upload_rate_kbps": 50.0,
        "download_rate_kbps": 100.0,
        "processes": ["chrome.exe", "notepad.exe", "explorer.exe"],
        "destinations": [
            {"ip": "1.2.3.4", "port": 80, "domain": "example.com"},
            {"ip": "5.6.7.8", "port": 443, "domain": "test.com"}
        ]
    }
    
    try:
        print("Sending test activity data...")
        response = requests.post(f"{BACKEND_URL}/activity", json=data, timeout=5)
        
        if response.status_code == 201:
            print("✅ SUCCESS: Activity data sent successfully!")
            print("Response:", response.json())
        else:
            print(f"❌ ERROR: Server responded with {response.status_code}")
            print("Response:", response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: Could not reach backend: {e}")
        
def test_get_students():
    """Test getting students from backend"""
    try:
        print("\nTesting student data retrieval...")
        response = requests.get(f"{BACKEND_URL}/admin/logs", timeout=5)
        
        if response.status_code == 200:
            students = response.json()
            print(f"✅ SUCCESS: Retrieved {len(students)} student records")
            if students:
                print("First student:")
                print(json.dumps(students[0], indent=2))
            else:
                print("No student data found.")
        else:
            print(f"❌ ERROR: Server responded with {response.status_code}")
            print("Response:", response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: Could not reach backend: {e}")

if __name__ == "__main__":
    test_send_activity()
    test_get_students()