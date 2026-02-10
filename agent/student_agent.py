import psutil
import socket
import requests
import time
from datetime import datetime

# ----------------------------------------------------------
# STUDENT AGENT - MEMBER 2 MODULE
# ----------------------------------------------------------

# Replace this with admin laptop IP
ADMIN_SERVER_IP = "192.168.0.100"      # CHANGE THIS
ADMIN_SERVER_PORT = 8000

API_URL = f"http://{ADMIN_SERVER_IP}:{ADMIN_SERVER_PORT}/activity"
SEND_INTERVAL = 5   # send every 5 seconds


def collect_system_data():
    """Collect running processes + network usage"""
    try:
        net_info = psutil.net_io_counters()
        proc_names = []

        for proc in psutil.process_iter(['name']):
            try:
                if proc.info['name']:
                    proc_names.append(proc.info['name'])
            except:
                pass  # skip processes we cannot read

        return {
            "hostname": socket.gethostname(),
            "timestamp": str(datetime.now()),
            "bytes_sent": net_info.bytes_sent,
            "bytes_recv": net_info.bytes_recv,
            "processes": proc_names[:25]
        }

    except Exception as error:
        print("Error collecting data:", error)
        return None


def send_to_admin(data):
    """Send data to backend API"""
    try:
        response = requests.post(API_URL, json=data, timeout=5)
        if response.status_code == 200:
            print(f"[SENT] {datetime.now()}")
        else:
            print("[WARN] server returned:", response.status_code)

    except Exception:
        print("[ERROR] Cannot reach admin server.")


if __name__ == "__main__":
    print("Student Agent Started (Member 2)...\n")

    while True:
        collected = collect_system_data()
        if collected:
            send_to_admin(collected)

        time.sleep(SEND_INTERVAL)
