# Quick Reference Guide

## 🚀 Getting Started (3 Steps)

```bash
# 1. Setup (Windows PowerShell)
cd backend
.\setup.ps1

# 2. Start server
python main.py

# 3. Test API
python test_api.py
```

---

## 📡 API Endpoints Quick Reference

### Base URL
```
http://localhost:8000
```

### Health Check
```bash
GET /                    # Health check
GET /health             # Alternative health check
```

### Activity Management
```bash
POST /activity          # Submit student activity data
GET /activity/test      # Test endpoint
```

### Alert Management
```bash
GET /alerts             # Get all alerts
GET /alerts/active      # Get active alerts only
PATCH /alerts/{id}/resolve  # Resolve an alert
GET /alerts/test        # Test endpoint
```

### Statistics
```bash
GET /stats/weekly              # Full weekly statistics
GET /stats/bandwidth-summary   # Bandwidth summary
GET /stats/alerts-summary      # Alerts summary
GET /stats/top-consumers       # Top 10 bandwidth users
GET /stats/test                # Test endpoint
```

---

## 📝 cURL Examples

### Submit Normal Activity
```bash
curl -X POST "http://localhost:8000/activity" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"STUDENT01\",\"bytes_sent\":1048576,\"bytes_recv\":2097152,\"processes\":[\"chrome.exe\",\"teams.exe\"]}"
```

### Submit Activity with Violation
```bash
curl -X POST "http://localhost:8000/activity" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"STUDENT02\",\"bytes_sent\":1048576,\"bytes_recv\":2097152,\"processes\":[\"chrome.exe\",\"utorrent.exe\"]}"
```

### Get Active Alerts
```bash
curl "http://localhost:8000/alerts/active"
```

### Resolve Alert
```bash
curl -X PATCH "http://localhost:8000/alerts/1/resolve"
```

### Get Weekly Stats
```bash
curl "http://localhost:8000/stats/weekly"
```

---

## 💻 PowerShell Examples

### Submit Activity
```powershell
$body = @{
    hostname = "STUDENT01"
    bytes_sent = 1048576
    bytes_recv = 2097152
    processes = @("chrome.exe", "python.exe")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/activity" -Method Post -Body $body -ContentType "application/json"
```

### Get Active Alerts
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/alerts/active" -Method Get
```

### Resolve Alert
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/alerts/1/resolve" -Method Patch
```

### Get Statistics
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/stats/weekly" -Method Get | ConvertTo-Json -Depth 10
```

---

## 🔧 Configuration (.env)

```bash
# Application
APP_NAME=Department Network Monitoring Dashboard
DEBUG=True

# Database
DATABASE_PATH=./monitoring.db

# Security (for future JWT)
SECRET_KEY=change-this-in-production
ALGORITHM=HS256

# Policy
BANDWIDTH_THRESHOLD_MB=500
BLOCKED_KEYWORDS=torrent,proxy,nmap,wireshark,metasploit

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 📊 Response Examples

### Activity Submission (Success)
```json
{
  "success": true,
  "activity_id": 1,
  "message": "Activity recorded successfully",
  "violation_detected": false,
  "alert_id": null
}
```

### Activity Submission (With Violation)
```json
{
  "success": true,
  "activity_id": 2,
  "message": "Activity recorded successfully",
  "violation_detected": true,
  "alert_id": 1
}
```

### Get Alerts
```json
{
  "alerts": [
    {
      "id": 1,
      "hostname": "STUDENT02",
      "reason": "Blocked application detected: utorrent.exe",
      "severity": "high",
      "status": "active",
      "timestamp": "2026-01-27T12:00:00.000000",
      "resolved_at": null,
      "activity_id": 2
    }
  ],
  "total": 1
}
```

### Weekly Statistics
```json
{
  "period": "Last 7 days",
  "total_bytes_sent": 10485760,
  "total_bytes_recv": 20971520,
  "total_bandwidth": 31457280,
  "total_bandwidth_mb": 30.0,
  "total_bandwidth_gb": 0.0293,
  "active_students": 5,
  "alert_count": 3,
  "alerts_by_severity": {
    "low": 0,
    "medium": 1,
    "high": 2,
    "critical": 0
  },
  "top_bandwidth_hosts": [
    {
      "hostname": "STUDENT01",
      "total_sent": 5242880,
      "total_recv": 10485760,
      "total_bandwidth": 15728640
    }
  ],
  "generated_at": "2026-01-27T12:00:00.000000"
}
```

---

## 🗄️ Database Queries (SQLite)

### View All Activities
```sql
SELECT * FROM activities ORDER BY timestamp DESC LIMIT 10;
```

### View Active Alerts
```sql
SELECT * FROM alerts WHERE status = 'active' ORDER BY timestamp DESC;
```

### Get Bandwidth by Hostname
```sql
SELECT 
    hostname,
    SUM(bytes_sent) as total_sent,
    SUM(bytes_recv) as total_recv,
    COUNT(*) as activity_count
FROM activities
GROUP BY hostname
ORDER BY (total_sent + total_recv) DESC;
```

### Get Alert Statistics
```sql
SELECT 
    severity,
    COUNT(*) as count
FROM alerts
WHERE datetime(timestamp) >= datetime('now', '-7 days')
GROUP BY severity;
```

---

## 🐍 Python Code Examples

### Using Requests Library
```python
import requests

# Submit activity
response = requests.post(
    "http://localhost:8000/activity",
    json={
        "hostname": "STUDENT01",
        "bytes_sent": 1048576,
        "bytes_recv": 2097152,
        "processes": ["chrome.exe", "python.exe"]
    }
)
print(response.json())

# Get active alerts
alerts = requests.get("http://localhost:8000/alerts/active")
print(alerts.json())

# Resolve alert
resolve = requests.patch("http://localhost:8000/alerts/1/resolve")
print(resolve.json())
```

### Async with httpx
```python
import httpx
import asyncio

async def submit_activity():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/activity",
            json={
                "hostname": "STUDENT01",
                "bytes_sent": 1048576,
                "bytes_recv": 2097152,
                "processes": ["chrome.exe"]
            }
        )
        return response.json()

result = asyncio.run(submit_activity())
print(result)
```

---

## 🔍 Troubleshooting

### Server Won't Start
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill process using port 8000 (if needed)
taskkill /PID <process_id> /F

# Or change port in main.py
uvicorn.run("main:app", port=8001)
```

### Database Locked
```bash
# Delete the database and restart
rm monitoring.db
python main.py
```

### Module Not Found
```bash
# Ensure virtual environment is activated
.\venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Import Errors
```bash
# Make sure you're in the backend directory
cd backend

# Run from correct location
python main.py
```

---

## 📚 File Locations

| Purpose | File | Description |
|---------|------|-------------|
| Main app | `main.py` | FastAPI application |
| Database | `database.py` | SQLite operations |
| Models | `models.py` | Pydantic schemas |
| Policies | `alerts.py` | Violation detection |
| Analytics | `stats.py` | Statistics engine |
| Config | `config.py` | Settings management |
| Routes | `routers/*.py` | API endpoints |
| Utils | `utils/*.py` | Helper functions |

---

## 🎓 Learning Resources

- **Interactive API Docs**: http://localhost:8000/docs
- **Architecture Guide**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Full Documentation**: [README.md](README.md)
- **Test Examples**: [test_api.py](test_api.py)

---

## ⚡ Common Tasks

### Add New Blocked Keyword
Edit `.env`:
```
BLOCKED_KEYWORDS=torrent,proxy,nmap,wireshark,metasploit,newkeyword
```
Restart server.

### Change Bandwidth Threshold
Edit `.env`:
```
BANDWIDTH_THRESHOLD_MB=1000
```
Restart server.

### Clear All Data
```bash
rm monitoring.db
python main.py
```

### Export Data
```bash
sqlite3 monitoring.db .dump > backup.sql
```

### Import Data
```bash
sqlite3 monitoring.db < backup.sql
```

---

## 🔐 Security Checklist (Production)

- [ ] Change `SECRET_KEY` in `.env`
- [ ] Set `DEBUG=False`
- [ ] Use PostgreSQL instead of SQLite
- [ ] Implement JWT authentication
- [ ] Add rate limiting
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up monitoring (Sentry)
- [ ] Enable database backups
- [ ] Review and audit logs

---

## 📞 Support

### Check Logs
Server logs show all activity and errors. Look for:
- `INFO` - Normal operations
- `WARNING` - Policy violations
- `ERROR` - System errors

### API Documentation
Visit http://localhost:8000/docs for:
- Interactive testing
- Schema information
- Example requests/responses

---

**Quick access URLs:**
- API Root: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
