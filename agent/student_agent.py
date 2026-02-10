import psutil
import socket
import requests
import time
from datetime import datetime

# ----------------------------------------------------------
# MEMBER 2 - STUDENT MONITORING AGENT
# ----------------------------------------------------------

ADMIN_SERVER_IP = "192.168.0.100"     # <-- CHANGE THIS
ADMIN_SERVER_PORT = 8000

API_URL = f"http://{ADMIN_SERVER_IP}:{ADMIN_SERVER_PORT}/activity"
SEND_INTERVAL = 5   # seconds


# ----------------------------------------------------------
# Get active network destinations (IP + domain)
# ----------------------------------------------------------
def get_active_destinations():
    destinations = []

    try:
        connections = psutil.net_connections(kind='inet')

        for conn in connections:
            if conn.raddr:  # remote address exists
                ip = conn.raddr.ip
                port = conn.raddr.port

                # Try reverse DNS lookup (domain)
                try:
                    domain = socket.gethostbyaddr(ip)[0]
                except:
                    domain = None  # if DNS fails, only IP is sent

                destinations.append({
                    "ip": ip,
                    "port": port,
                    "domain": domain
                })

        return destinations

    except Exception as e:
        print("Error capturing destinations:", e)
        return []


# ----------------------------------------------------------
# Collect system data (apps, network usage, etc.)
# ----------------------------------------------------------
def collect_system_data():
    try:
        net = psutil.net_io_counters()
        processes = []

        for proc in psutil.process_iter(['name']):
            try:
                if proc.info["name"]:
                    processes.append(proc.info["name"])
            except:
                pass

        return {
            "hostname": socket.gethostname(),
            "timestamp": str(datetime.now()),
            "bytes_sent": net.bytes_sent,
            "bytes_recv": net.bytes_recv,
            "processes": processes[:25],
            "destinations": get_active_destinations()
        }

    except Exception as e:
        print("Error collecting system data:", e)
        return None


# ----------------------------------------------------------
# Send data to admin backend
# ----------------------------------------------------------
def send_to_admin(data):
    try:
        response = requests.post(API_URL, json=data, timeout=5)
        if response.status_code == 200:
            print(f"[SENT] {datetime.now()}")
        else:
            print("[WARN] Server responded:", response.status_code)
    except:
        print("[ERROR] Could not reach admin server.")


# ----------------------------------------------------------
# MAIN LOOP
# ----------------------------------------------------------
if __name__ == "__main__":
    print("Student Agent Started (Member 2)\n")

    while True:
        payload = collect_system_data()
        if payload:
            send_to_admin(payload)

        time.sleep(SEND_INTERVAL)
