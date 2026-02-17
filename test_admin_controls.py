#!/usr/bin/env python3
"""
Test the admin blocking functionality
"""

import json
from urllib.request import urlopen, Request
import time

def test_admin_block():
    """Test sending a block command to a student"""
    
    # Step 1: Send a block command
    block_data = {
        "student_id": "FRIEND-LAPTOP-01",
        "domain": "youtube.com", 
        "reason": "Testing admin block feature"
    }
    
    try:
        json_data = json.dumps(block_data).encode('utf-8')
        req = Request(
            "http://10.154.216.252:8001/commands/block-domain",
            data=json_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print("Sending block command for youtube.com...")
        response = urlopen(req, timeout=10)
        result = json.loads(response.read().decode('utf-8'))
        
        print("✅ Block command sent successfully!")
        print(f"Command ID: {result.get('command_id')}")
        
        # Step 2: Check if command is pending
        time.sleep(1)
        check_req = Request(f"http://10.154.216.252:8001/commands?student_id=FRIEND-LAPTOP-01")
        check_response = urlopen(check_req, timeout=5)
        commands = json.loads(check_response.read().decode('utf-8'))
        
        print(f"✅ Pending commands for student: {len(commands.get('commands', []))}")
        
        return True
        
    except Exception as e:
        print(f"❌ Block test failed: {e}")
        return False

def test_unblock():
    """Test unblock command"""
    
    unblock_data = {
        "student_id": "FRIEND-LAPTOP-01", 
        "domain": "youtube.com",
        "reason": "Testing admin unblock feature"
    }
    
    try:
        json_data = json.dumps(unblock_data).encode('utf-8')
        req = Request(
            "http://10.154.216.252:8001/commands/unblock-domain",
            data=json_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print("Sending unblock command...")
        response = urlopen(req, timeout=10)
        result = json.loads(response.read().decode('utf-8'))
        
        print("✅ Unblock command sent successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Unblock test failed: {e}")
        return False

def check_students():
    """Check current students in dashboard"""
    try:
        req = Request("http://10.154.216.252:8001/admin/logs")
        response = urlopen(req, timeout=5)
        students = json.loads(response.read().decode('utf-8'))
        
        print(f"\n📊 Current students in dashboard: {len(students)}")
        for student in students:
            hostname = student.get('hostname', 'Unknown')  
            cpu = student.get('cpu', 0)
            network_mb = student.get('network_mb', 0)
            apps = student.get('apps', [])
            print(f"  - {hostname}: CPU {cpu}%, Network {network_mb}MB, Apps: {apps[:2]}")
            
    except Exception as e:
        print(f"❌ Failed to get students: {e}")

if __name__ == "__main__":
    print("=== Testing Admin Controls ===")
    
    # Check current students
    check_students()
    
    print("\n=== Testing Block/Unblock Commands ===")  
    
    # Test blocking
    if test_admin_block():
        time.sleep(2)
        # Test unblocking  
        test_unblock()
    
    print("\n=== Test Complete ===")
    print("Your friend can now run 'python student_agent.py' and you'll see them in the dashboard!")
    print("Use the frontend at http://localhost:3004/students to see live data and control blocking.")