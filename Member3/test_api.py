"""
Test script to verify backend functionality.
Run this after starting the server to ensure everything works.
"""
import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"

def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_health_check():
    """Test health check endpoint."""
    print_section("Testing Health Check")
    
    response = requests.get(f"{BASE_URL}/")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200, "Health check failed"
    print("✓ Health check passed")

def test_submit_normal_activity():
    """Test submitting normal activity without violations."""
    print_section("Testing Normal Activity Submission")
    
    data = {
        "hostname": "STUDENT01",
        "bytes_sent": 1048576,  # 1 MB
        "bytes_recv": 2097152,  # 2 MB
        "processes": ["chrome.exe", "teams.exe", "outlook.exe"]
    }
    
    response = requests.post(f"{BASE_URL}/activity", json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 201, "Activity submission failed"
    result = response.json()
    assert result['success'], "Activity submission not successful"
    assert not result['violation_detected'], "Unexpected violation detected"
    print("✓ Normal activity submission passed")
    
    return result['activity_id']

def test_submit_blocked_process():
    """Test submitting activity with blocked process."""
    print_section("Testing Blocked Process Detection")
    
    data = {
        "hostname": "STUDENT02",
        "bytes_sent": 1048576,
        "bytes_recv": 2097152,
        "processes": ["chrome.exe", "utorrent.exe", "outlook.exe"]
    }
    
    response = requests.post(f"{BASE_URL}/activity", json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 201, "Activity submission failed"
    result = response.json()
    assert result['success'], "Activity submission not successful"
    assert result['violation_detected'], "Violation not detected"
    assert result['alert_id'] is not None, "Alert not created"
    print("✓ Blocked process detection passed")
    
    return result['alert_id']

def test_submit_bandwidth_violation():
    """Test submitting activity with bandwidth violation."""
    print_section("Testing Bandwidth Threshold Detection")
    
    data = {
        "hostname": "STUDENT03",
        "bytes_sent": 314572800,  # 300 MB
        "bytes_recv": 314572800,  # 300 MB (total > 500 MB threshold)
        "processes": ["chrome.exe", "steam.exe"]
    }
    
    response = requests.post(f"{BASE_URL}/activity", json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 201, "Activity submission failed"
    result = response.json()
    assert result['success'], "Activity submission not successful"
    assert result['violation_detected'], "Bandwidth violation not detected"
    print("✓ Bandwidth threshold detection passed")

def test_get_all_alerts():
    """Test retrieving all alerts."""
    print_section("Testing Get All Alerts")
    
    response = requests.get(f"{BASE_URL}/alerts")
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Total Alerts: {result['total']}")
    print(f"Response: {json.dumps(result, indent=2)[:500]}...")
    
    assert response.status_code == 200, "Get alerts failed"
    assert result['total'] > 0, "No alerts found"
    print("✓ Get all alerts passed")

def test_get_active_alerts():
    """Test retrieving active alerts."""
    print_section("Testing Get Active Alerts")
    
    response = requests.get(f"{BASE_URL}/alerts/active")
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Active Alerts: {result['total']}")
    print(f"Response: {json.dumps(result, indent=2)[:500]}...")
    
    assert response.status_code == 200, "Get active alerts failed"
    print("✓ Get active alerts passed")
    
    return result['alerts']

def test_resolve_alert(alert_id):
    """Test resolving an alert."""
    print_section(f"Testing Resolve Alert (ID: {alert_id})")
    
    response = requests.patch(f"{BASE_URL}/alerts/{alert_id}/resolve")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200, "Alert resolution failed"
    result = response.json()
    assert result['success'], "Alert resolution not successful"
    print("✓ Alert resolution passed")

def test_weekly_stats():
    """Test retrieving weekly statistics."""
    print_section("Testing Weekly Statistics")
    
    response = requests.get(f"{BASE_URL}/stats/weekly")
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    assert response.status_code == 200, "Get weekly stats failed"
    assert result['active_students'] >= 0, "Invalid active students count"
    assert result['total_bandwidth'] >= 0, "Invalid bandwidth count"
    print("✓ Weekly statistics passed")

def test_bandwidth_summary():
    """Test bandwidth summary endpoint."""
    print_section("Testing Bandwidth Summary")
    
    response = requests.get(f"{BASE_URL}/stats/bandwidth-summary")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200, "Get bandwidth summary failed"
    print("✓ Bandwidth summary passed")

def test_alerts_summary():
    """Test alerts summary endpoint."""
    print_section("Testing Alerts Summary")
    
    response = requests.get(f"{BASE_URL}/stats/alerts-summary")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200, "Get alerts summary failed"
    print("✓ Alerts summary passed")

def main():
    """Run all tests."""
    print(f"\n{'#'*60}")
    print("#  BACKEND API TEST SUITE")
    print("#  Starting tests at:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print(f"#  Base URL: {BASE_URL}")
    print(f"{'#'*60}")
    
    try:
        # Test health check
        test_health_check()
        
        # Test activity submission
        test_submit_normal_activity()
        alert_id = test_submit_blocked_process()
        test_submit_bandwidth_violation()
        
        # Test alert endpoints
        test_get_all_alerts()
        active_alerts = test_get_active_alerts()
        
        # Resolve one alert if available
        if active_alerts:
            test_resolve_alert(active_alerts[0]['id'])
        elif alert_id:
            test_resolve_alert(alert_id)
        
        # Test statistics endpoints
        test_weekly_stats()
        test_bandwidth_summary()
        test_alerts_summary()
        
        # Final summary
        print_section("ALL TESTS PASSED ✓")
        print("The backend is working correctly!")
        print("\nYou can now:")
        print("1. View API docs at: http://localhost:8000/docs")
        print("2. Connect your React frontend")
        print("3. Deploy the Python agent to student machines")
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: Cannot connect to {BASE_URL}")
        print("Make sure the backend server is running:")
        print("  python main.py")
        return 1
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
