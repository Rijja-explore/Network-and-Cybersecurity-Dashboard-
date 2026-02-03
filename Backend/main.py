from fastapi import FastAPI
from datetime import datetime
from firewall import block_ip

app = FastAPI(title="Department Network Monitoring Dashboard")

# In-memory storage (enough for demo)
students = {}
alerts = []
admin_actions = []

# -------------------------------
# HOME
# -------------------------------
@app.get("/")
def home():
    return {"status": "Admin Server Running"}

# -------------------------------
# RECEIVE STUDENT ACTIVITY
# -------------------------------
@app.post("/activity")
def receive_activity(data: dict):
    hostname = data.get("hostname")
    processes = data.get("processes", [])
    bytes_sent = data.get("bytes_sent", 0)

    students[hostname] = {
        "hostname": hostname,
        "processes": processes,
        "bytes_sent": bytes_sent,
        "last_seen": str(datetime.now())
    }

    # SECURITY POLICY CHECK
    blocked_keywords = ["torrent", "utorrent", "nmap", "proxy", "vpn"]
    for proc in processes:
        for bad in blocked_keywords:
            if bad in proc.lower():
                alert = {
                    "hostname": hostname,
                    "process": proc,
                    "type": "Policy Violation",
                    "time": str(datetime.now())
                }
                alerts.append(alert)

    return {"message": "Activity received"}

# -------------------------------
# VIEW CONNECTED STUDENTS
# -------------------------------
@app.get("/students")
def get_students():
    return students

# -------------------------------
# VIEW ALERTS
# -------------------------------
@app.get("/alerts")
def get_alerts():
    return alerts

# -------------------------------
# NETWORK HEALTH (CENTRALIZED)
# -------------------------------
@app.get("/network-health")
def network_health():
    return {
        "active_systems": len(students),
        "total_bandwidth_used": sum(
            s["bytes_sent"] for s in students.values()
        ),
        "health_status": "Healthy" if len(alerts) == 0 else "Warning"
    }

# -------------------------------
# ADMIN BLOCK ACTION
# -------------------------------
@app.post("/block/{ip}")
def block_student(ip: str):
    block_ip(ip)

    action = {
        "action": "BLOCK",
        "ip": ip,
        "time": str(datetime.now())
    }
    admin_actions.append(action)

    return {"status": f"{ip} blocked successfully"}

# -------------------------------
# ADMIN ACTION LOGS
# -------------------------------
@app.get("/admin-actions")
def get_admin_actions():
    return admin_actions
