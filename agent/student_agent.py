import psutil
import socket
import requests
import time
from datetime import datetime

# ----------------------------------------------------------
# STUDENT AGENT - FINAL VERSION (Matches Prompt Exactly)
# ----------------------------------------------------------

# ----------------------------------------------------------
# STUDENT AGENT - MEMBER 2 MODULE
# ----------------------------------------------------------

# BACKEND SERVER IP (NOT ADMIN LAPTOP)
BACKEND_SERVER_IP = "10.70.248.252"   # IP of machine running FastAPI
BACKEND_SERVER_PORT = 8000

API_URL = f"http://{BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}/activity"
SEND_INTERVAL = 5   # send every 5 seconds

# ----------------------------------------------------------
# Network destinations (IP + domain only)
# ----------------------------------------------------------
def get_active_destinations():
    destinations = []

    try:
        conns = psutil.net_connections(kind='inet')

        for conn in conns:
            if conn.raddr:  # remote end exists
                ip = conn.raddr.ip
                port = conn.raddr.port

                # domain-level resolution (no deep inspection)
                try:
                    domain = socket.gethostbyaddr(ip)[0]
                except:
                    domain = None

                destinations.append({
                    "ip": ip,
                    "port": port,
                    "domain": domain
                })

    except Exception as e:
        print("Destination error:", e)

    return destinations


# ----------------------------------------------------------
# System activity (hostname, processes, network usage)
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
            "student_id": socket.gethostname(),  # unique identity
            "hostname": socket.gethostname(),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),

            "bytes_sent": net.bytes_sent,
            "bytes_received": net.bytes_recv,

            "running_processes": processes[:25],  # safe limit
            "accessed_destinations": get_active_destinations()
        }

    except Exception as e:
        print("System data error:", e)
        return None


# ----------------------------------------------------------
# Send to backend (REST API, resilient)
# ----------------------------------------------------------
def send_to_backend(payload):
    try:
        response = requests.post(API_URL, json=payload, timeout=5)

        if response.status_code == 200:
            print("[OK] Sent", payload["timestamp"])
        else:
            print("[WARN] Backend error:", response.status_code)

    except Exception:
        print("[ERROR] Backend unreachable")


# ----------------------------------------------------------
# Passive continuous loop
# ----------------------------------------------------------
if __name__ == "__main__":
    print("Student Agent Running (Final Prompt Version)...")

    while True:
        data = collect_system_data()
        if data:
            send_to_backend(data)

        time.sleep(SEND_INTERVAL)
