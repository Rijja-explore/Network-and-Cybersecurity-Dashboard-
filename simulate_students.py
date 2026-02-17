#!/usr/bin/env python3
"""
Student Agent Simulator - sends data exactly like the real agent
"""

import json
import socket
from urllib.request import urlopen, Request
from datetime import datetime
import time

# Configuration
BACKEND_URL = "http://localhost:8000/activity"
STUDENT_HOSTNAMES = ["STUDENT-PC-003", "STUDENT-LAB-001", "RESEARCH-LAB-02"]

def simulate_student_data(hostname):
    """Simulate realistic student activity data"""
    
    data = {
        "hostname": hostname,
        "timestamp": datetime.now().isoformat(),
        "bytes_sent": 5000000 + (hash(hostname) % 10000000),  # 5-15 MB
        "bytes_recv": 15000000 + (hash(hostname) % 20000000),  # 15-35 MB
        "cpu_percent": 30.0 + (hash(hostname) % 50),  # 30-80%
        "memory_percent": 45.0 + (hash(hostname) % 40),  # 45-85%
        "disk_percent": 60.0 + (hash(hostname) % 30),  # 60-90%
        "active_connections": 8 + (hash(hostname) % 15),  # 8-23 connections
        "upload_rate_kbps": 25.0 + (hash(hostname) % 200),
        "download_rate_kbps": 150.0 + (hash(hostname) % 500),
        "processes": [
            "chrome.exe", "discord.exe", "teams.exe", "notepad.exe", 
            "explorer.exe", "winword.exe", "code.exe"
        ][:3 + (hash(hostname) % 4)],  # 3-6 processes
        "destinations": [
            {"ip": "142.250.189.110", "port": 443, "domain": "google.com"},
            {"ip": "157.240.12.35", "port": 443, "domain": "facebook.com"},
            {"ip": "13.107.42.14", "port": 443, "domain": "teams.microsoft.com"},
            {"ip": "140.82.114.3", "port": 443, "domain": "github.com"},
            {"ip": "104.16.132.229", "port": 443, "domain": "discord.com"}
        ][:2 + (hash(hostname) % 3)]  # 2-4 destinations
    }
    
    return data

def send_student_activity(hostname):
    """Send activity data for one student"""
    
    data = simulate_student_data(hostname)
    
    try:
        json_data = json.dumps(data).encode('utf-8')
        req = Request(
            BACKEND_URL, 
            data=json_data, 
            headers={'Content-Type': 'application/json'}
        )
        
        response = urlopen(req, timeout=5)
        response_data = json.loads(response.read().decode('utf-8'))
        
        print(f"✅ {hostname}: Activity sent successfully (ID: {response_data.get('activity_id')})")
        return True
        
    except Exception as e:
        print(f"❌ {hostname}: Failed to send activity - {e}")
        return False

def check_admin_logs():
    """Check the admin logs endpoint"""
    try:
        req = Request("http://localhost:8000/admin/logs")
        response = urlopen(req, timeout=5)
        data = json.loads(response.read().decode('utf-8'))
        
        print(f"\n📊 Admin Logs Retrieved: {len(data)} records")
        print("=" * 60)
        
        for i, student in enumerate(data[:5]):  # Show first 5
            hostname = student.get('hostname', 'Unknown')
            network_mb = student.get('network_mb', 0)
            cpu = student.get('cpu', 0)
            processes = student.get('apps', [])
            timestamp = student.get('timestamp', '')
            
            print(f"{i+1}. {hostname}")
            print(f"   CPU: {cpu}% | Network: {network_mb} MB")
            print(f"   Apps: {', '.join(processes[:3])}")
            print(f"   Last seen: {timestamp}")
            print()
            
        return data
        
    except Exception as e:
        print(f"❌ ERROR checking admin logs: {e}")
        return []

if __name__ == "__main__":
    print("=== Student Agent Simulator ===")
    print("Simulating multiple student machines sending data...\n")
    
    success_count = 0
    
    # Send data for multiple students
    for hostname in STUDENT_HOSTNAMES:
        if send_student_activity(hostname):
            success_count += 1
        time.sleep(1)  # Small delay between requests
    
    print(f"\n📈 Successfully sent data for {success_count}/{len(STUDENT_HOSTNAMES)} students")
    
    # Wait a moment for database to update
    print("\nWaiting 2 seconds for database update...")
    time.sleep(2)
    
    # Check what's in the admin logs
    admin_data = check_admin_logs()
    
    print(f"\n🎯 Summary: Backend has {len(admin_data)} student records total")
    print("=== Simulation Complete ===")