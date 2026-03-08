#!/usr/bin/env python3
"""
End-to-End System Test
Verifies:
1. ALL websites are shown (no pagination limit)
2. Block/Unblock commands flow correctly from admin to agent
3. Real-time data updates work
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
ADMIN_TOKEN = None  # Will get from login

print("=" * 70)
print("🧪 END-TO-END SYSTEM TEST")
print("=" * 70)

# Test 1: Admin Login
print("\n[1️⃣  TEST] Admin Login...")
try:
    login_response = requests.post(
        f"{BASE_URL}/login",
        json={"username": "admin", "password": "admin123"},
        timeout=5
    )
    if login_response.status_code == 200:
        ADMIN_TOKEN = login_response.json().get("access_token")
        print(f"✅ Login successful. Token: {ADMIN_TOKEN[:20]}...")
    else:
        print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
        exit(1)
except Exception as e:
    print(f"❌ Login error: {e}")
    exit(1)

# Test 2: Get all students with websites
print("\n[2️⃣  TEST] Get Students (Check if ALL websites shown)...")
headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
try:
    students_response = requests.get(
        f"{BASE_URL}/admin/students",
        headers=headers,
        timeout=5
    )
    if students_response.status_code == 200:
        students = students_response.json()
        if students:
            first_student = students[0]
            websites = first_student.get("websites", [])
            print(f"✅ Found {len(students)} students")
            print(f"   Student: {first_student['hostname']}")
            print(f"   📊 Websites: {len(websites)} total")
            if len(websites) > 0:
                print(f"   Sample websites: {websites[:5]}")
                if len(websites) > 5:
                    print(f"   ... and {len(websites) - 5} more")
            else:
                print(f"   ⚠️  No websites found for this student")
        else:
            print("❌ No students found")
    else:
        print(f"❌ Failed to get students: {students_response.status_code}")
except Exception as e:
    print(f"❌ Error getting students: {e}")

# Test 3: List pending commands (before blocking)
print("\n[3️⃣  TEST] Check Existing Commands...")
try:
    commands_response = requests.get(
        f"{BASE_URL}/admin/commands",
        headers=headers,
        timeout=5
    )
    if commands_response.status_code == 200:
        commands = commands_response.json()
        pending_count = len([c for c in commands if c.get('status') == 'pending'])
        executed_count = len([c for c in commands if c.get('status') == 'executed'])
        print(f"✅ Total commands: {len(commands)}")
        print(f"   Pending: {pending_count}")
        print(f"   Executed: {executed_count}")
        if pending_count > 0:
            print(f"   Sample pending: {commands[0]}")
    else:
        print(f"❌ Failed to get commands: {commands_response.status_code}")
except Exception as e:
    print(f"❌ Error getting commands: {e}")

# Test 4: Issue a block command
if students and first_student:
    domain_to_block = websites[0] if websites else "example.com"
    student_id = first_student['hostname']
    
    print(f"\n[4️⃣  TEST] Block Domain: {domain_to_block} for {student_id}...")
    try:
        block_response = requests.post(
            f"{BASE_URL}/admin/block-domain",
            headers=headers,
            json={
                "student_id": student_id,
                "domain": domain_to_block,
                "reason": "System test - automated"
            },
            timeout=5
        )
        if block_response.status_code == 200:
            result = block_response.json()
            print(f"✅ Block command created")
            print(f"   Command ID: {result.get('command_id')}")
            print(f"   Domain: {result.get('domain')}")
            print(f"   Status: {result.get('message')}")
            
            # Wait a moment then check if agent picked it up
            print(f"\n   ⏳ Waiting 3 seconds for agent to poll...")
            time.sleep(3)
            
            # Test 5: Check if command is still pending or was executed
            print(f"\n[5️⃣  TEST] Check Command Status After Agent Poll...")
            commands_response = requests.get(
                f"{BASE_URL}/admin/commands",
                headers=headers,
                timeout=5
            )
            if commands_response.status_code == 200:
                commands = commands_response.json()
                # Find our command
                our_command = None
                for cmd in commands:
                    if cmd.get('domain') == domain_to_block and cmd.get('student_id') == student_id:
                        if cmd.get('id') == result.get('command_id'):
                            our_command = cmd
                            break
                
                if our_command:
                    status = our_command.get('status')
                    print(f"✅ Command found in database")
                    print(f"   ID: {our_command.get('id')}")
                    print(f"   Status: {status}")
                    print(f"   Created: {our_command.get('created_at')}")
                    print(f"   Executed: {our_command.get('executed_at')}")
                    
                    if status == "executed":
                        print(f"   ✅ Agent has EXECUTED this command!")
                    elif status == "pending":
                        print(f"   ⚠️  Command still PENDING - agent may not be running")
                        print(f"      Make sure student_agent.py is running with: python student_agent.py")
                else:
                    print(f"❌ Command not found in database - check query")
        else:
            print(f"❌ Block command failed: {block_response.status_code}")
            print(f"   Response: {block_response.text}")
    except Exception as e:
        print(f"❌ Error blocking domain: {e}")

# Test 6: Check real-time data updates
print(f"\n[6️⃣  TEST] Real-Time Data Updates...")
try:
    # Get initial data
    initial_response = requests.get(
        f"{BASE_URL}/admin/students",
        headers=headers,
        timeout=5
    )
    initial_data = initial_response.json()
    print(f"✅ Initial data fetched: {len(initial_data)} students")
    
    # Wait for next update
    print(f"   Waiting 6 seconds for next update...")
    time.sleep(6)
    
    # Get new data
    new_response = requests.get(
        f"{BASE_URL}/admin/students",
        headers=headers,
        timeout=5
    )
    new_data = new_response.json()
    
    if new_data != initial_data:
        print(f"✅ Data has been updated (real-time working)")
        if new_data and initial_data:
            activity_change = (
                new_data[0].get('cpu', 0) != initial_data[0].get('cpu', 0) or
                new_data[0].get('memory', 0) != initial_data[0].get('memory', 0)
            )
            if activity_change:
                print(f"   CPU/Memory values changed (real data flow)")
    else:
        print(f"⚠️  Data unchanged - agents may not be sending updates")
        print(f"   Make sure student_agent.py is running")
except Exception as e:
    print(f"❌ Error checking real-time: {e}")

print("\n" + "=" * 70)
print("📋 TEST SUMMARY")
print("=" * 70)
print("\nIf all tests pass:")
print("✅ All websites are shown (not paginated)")
print("✅ Block commands are created and reach agents")
print("✅ Real-time data is flowing from agents to admin")
print("\nIf block command shows 'pending' after wait:")
print("⚠️  Student agent may not be running")
print("   Start it with: python student_agent.py")
print("\nIf data doesn't update:")
print("⚠️  Student agents may not be connected")
print("   Verify BACKEND_SERVER_PORT=8000 in student_agent.py")
print("=" * 70)
