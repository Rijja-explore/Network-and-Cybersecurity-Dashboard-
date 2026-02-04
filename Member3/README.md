# Department Network Monitoring and Cybersecurity Dashboard - Backend

A production-grade FastAPI backend for monitoring student machine activity, detecting policy violations, and providing network analytics for college network administrators.

## 🎯 Project Overview

This is a **legal, admin-controlled monitoring system** designed for educational institutions to:
- Monitor network activity on student machines
- Detect policy violations in real-time
- Generate security alerts
- Provide weekly network statistics
- Support a React-based admin dashboard

**Important**: This system focuses on process-level and usage-level monitoring. It does NOT involve packet sniffing or illegal surveillance.

---

## 🏗️ Architecture

```
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration and settings
├── database.py          # SQLite database operations
├── models.py            # Pydantic request/response models
├── alerts.py            # Policy violation detection engine
├── stats.py             # Statistics calculation engine
├── routers/
│   ├── __init__.py
│   ├── activity.py      # Activity ingestion endpoints
│   ├── alerts.py        # Alert management endpoints
│   └── stats.py         # Statistics endpoints
├── utils/
│   ├── __init__.py
│   └── time.py          # Time utility functions
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
└── monitoring.db        # SQLite database (auto-created)
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create environment configuration:**
   ```bash
   copy .env.example .env
   ```
   Edit `.env` to customize settings if needed.

6. **Run the backend:**
   ```bash
   python main.py
   ```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

---

## 📡 API Endpoints

### Health Check

#### `GET /`
Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "Department Network Monitoring Dashboard",
  "version": "1.0.0",
  "timestamp": "2026-01-27T12:00:00.000000"
}
```

---

### Activity Ingestion

#### `POST /activity`
Submit student machine activity data (called by Python agent).

**Request Body:**
```json
{
  "hostname": "STUDENT01",
  "bytes_sent": 123456,
  "bytes_recv": 654321,
  "processes": ["chrome.exe", "python.exe", "vscode.exe"]
}
```

**Response:**
```json
{
  "success": true,
  "activity_id": 1,
  "message": "Activity recorded successfully",
  "violation_detected": false,
  "alert_id": null
}
```

**Example (curl):**
```bash
curl -X POST "http://localhost:8000/activity" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"STUDENT01\",\"bytes_sent\":123456,\"bytes_recv\":654321,\"processes\":[\"chrome.exe\",\"python.exe\"]}"
```

**Example with violation:**
```bash
curl -X POST "http://localhost:8000/activity" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"STUDENT01\",\"bytes_sent\":123456,\"bytes_recv\":654321,\"processes\":[\"utorrent.exe\",\"chrome.exe\"]}"
```

---

### Alert Management

#### `GET /alerts`
Retrieve all alerts (active and resolved).

**Response:**
```json
{
  "alerts": [
    {
      "id": 1,
      "hostname": "STUDENT01",
      "reason": "Blocked application detected: utorrent.exe",
      "severity": "high",
      "status": "active",
      "timestamp": "2026-01-27T12:00:00.000000",
      "resolved_at": null,
      "activity_id": 1
    }
  ],
  "total": 1
}
```

**Example (curl):**
```bash
curl "http://localhost:8000/alerts"
```

#### `GET /alerts/active`
Retrieve only active (unresolved) alerts.

**Example (curl):**
```bash
curl "http://localhost:8000/alerts/active"
```

#### `PATCH /alerts/{alert_id}/resolve`
Mark an alert as resolved.

**Response:**
```json
{
  "success": true,
  "alert_id": 1,
  "message": "Alert resolved successfully"
}
```

**Example (curl):**
```bash
curl -X PATCH "http://localhost:8000/alerts/1/resolve"
```

---

### Statistics & Analytics

#### `GET /stats/weekly`
Get comprehensive weekly statistics (last 7 days).

**Response:**
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

**Example (curl):**
```bash
curl "http://localhost:8000/stats/weekly"
```

#### `GET /stats/bandwidth-summary`
Get simplified bandwidth summary.

**Example (curl):**
```bash
curl "http://localhost:8000/stats/bandwidth-summary"
```

#### `GET /stats/alerts-summary`
Get alert statistics summary.

**Example (curl):**
```bash
curl "http://localhost:8000/stats/alerts-summary"
```

#### `GET /stats/top-consumers`
Get top 10 bandwidth-consuming hosts.

**Example (curl):**
```bash
curl "http://localhost:8000/stats/top-consumers"
```

---

## 🔒 Policy Configuration

### Blocked Keywords
The system monitors for these keywords in process names:
- `torrent` - Peer-to-peer file sharing
- `proxy` - Proxy tools
- `nmap` - Network scanning
- `wireshark` - Packet analysis
- `metasploit` - Penetration testing

Configure in `.env`:
```
BLOCKED_KEYWORDS=torrent,proxy,nmap,wireshark,metasploit
```

### Bandwidth Threshold
Default: 500 MB per activity report

Configure in `.env`:
```
BANDWIDTH_THRESHOLD_MB=500
```

---

## 🗄️ Database Schema

### `activities` Table
Stores all student activity submissions.

| Column        | Type    | Description                          |
|---------------|---------|--------------------------------------|
| id            | INTEGER | Primary key                          |
| hostname      | TEXT    | Student machine hostname             |
| bytes_sent    | INTEGER | Bytes sent by machine                |
| bytes_recv    | INTEGER | Bytes received by machine            |
| process_list  | TEXT    | JSON array of running processes      |
| timestamp     | TEXT    | ISO timestamp of activity            |
| created_at    | TEXT    | Record creation time                 |

### `alerts` Table
Stores security alerts and violations.

| Column        | Type    | Description                          |
|---------------|---------|--------------------------------------|
| id            | INTEGER | Primary key                          |
| hostname      | TEXT    | Affected machine hostname            |
| reason        | TEXT    | Violation description                |
| severity      | TEXT    | low/medium/high/critical             |
| activity_id   | INTEGER | Related activity record (FK)         |
| status        | TEXT    | active/resolved                      |
| timestamp     | TEXT    | ISO timestamp of alert               |
| resolved_at   | TEXT    | Resolution timestamp (nullable)      |
| created_at    | TEXT    | Record creation time                 |

---

## 🛠️ Development

### Running in Development Mode

```bash
python main.py
```

The server will run with auto-reload enabled, automatically restarting when code changes are detected.

### Using Uvicorn Directly

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing with PowerShell

**Submit activity:**
```powershell
$body = @{
    hostname = "STUDENT01"
    bytes_sent = 123456
    bytes_recv = 654321
    processes = @("chrome.exe", "python.exe")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/activity" -Method Post -Body $body -ContentType "application/json"
```

**Get active alerts:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/alerts/active" -Method Get
```

**Resolve an alert:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/alerts/1/resolve" -Method Patch
```

---

## 📊 Statistics Features

The statistics engine provides:

1. **Bandwidth Analysis**
   - Total bytes sent/received
   - Conversion to MB and GB
   - Average per student

2. **Top Consumers**
   - Top 10 bandwidth users
   - Detailed breakdown by host

3. **Alert Analytics**
   - Total alert count
   - Breakdown by severity
   - Percentage distribution

4. **Chart-Ready Data**
   - All responses optimized for React charts
   - Consistent data structures
   - ISO timestamps for time-series

---

## 🔐 Authentication Structure

The system is **JWT-ready** but does not fully implement authentication to keep the demo simple.

### To Add Full Authentication:

1. Implement user registration/login endpoints
2. Use `python-jose` for JWT token generation
3. Add dependency injection for protected routes
4. Store user credentials securely (hashed passwords)

**Placeholder structure is already in place** in `config.py`:
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`

---

## 🌐 CORS Configuration

Default allowed origins:
- `http://localhost:3000` (React development)
- `http://localhost:5173` (Vite development)

Configure in `.env`:
```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 📝 Logging

The system uses Python's built-in logging with INFO level by default.

**Log output includes:**
- Startup/shutdown events
- Incoming activity submissions
- Policy violations detected
- Alert creations
- API endpoint access
- Error details

---

## 🧪 Testing Examples

### Scenario 1: Normal Activity
```bash
curl -X POST "http://localhost:8000/activity" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"LAB-PC-01\",\"bytes_sent\":1048576,\"bytes_recv\":2097152,\"processes\":[\"chrome.exe\",\"teams.exe\",\"outlook.exe\"]}"
```

### Scenario 2: Blocked Process
```bash
curl -X POST "http://localhost:8000/activity" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"LAB-PC-02\",\"bytes_sent\":1048576,\"bytes_recv\":2097152,\"processes\":[\"chrome.exe\",\"nmap.exe\"]}"
```

### Scenario 3: Bandwidth Violation
```bash
curl -X POST "http://localhost:8000/activity" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"LAB-PC-03\",\"bytes_sent\":314572800,\"bytes_recv\":314572800,\"processes\":[\"chrome.exe\"]}"
```

### Scenario 4: Multiple Violations
```bash
curl -X POST "http://localhost:8000/activity" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\":\"LAB-PC-04\",\"bytes_sent\":314572800,\"bytes_recv\":314572800,\"processes\":[\"utorrent.exe\",\"chrome.exe\"]}"
```

---

## 🏆 Production Considerations

### Before Deployment:

1. **Change SECRET_KEY** in `.env` to a secure random value
2. **Set DEBUG=False** in production
3. **Use proper database** (PostgreSQL/MySQL) instead of SQLite
4. **Implement full authentication** with user management
5. **Add rate limiting** to prevent abuse
6. **Set up HTTPS** with proper SSL certificates
7. **Configure proper CORS** origins
8. **Add monitoring and alerting** (e.g., Sentry)
9. **Set up backup strategy** for database
10. **Review and audit** security policies

### Deployment Options:

- **Docker**: Create Dockerfile and docker-compose
- **Cloud**: Deploy to AWS, Azure, or GCP
- **VPS**: Use systemd service on Linux VPS
- **Platform**: Deploy to Heroku, Railway, or Render

---

## 📖 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
  - Interactive API testing
  - Request/response examples
  - Schema documentation

- **ReDoc**: http://localhost:8000/redoc
  - Clean, printable documentation
  - Detailed model schemas

---

## 🤝 Support & Maintenance

### Common Issues:

**Database locked error:**
- Close any other connections to the database
- Restart the server

**Port already in use:**
- Change port in `main.py` or kill process using port 8000

**Module not found:**
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

---

## 📜 Legal Notice

This software is designed for **legitimate network monitoring** in educational institutions. It must be:

- Used only by authorized network administrators
- Deployed with proper user notification
- Compliant with local privacy laws
- Used for security and management purposes only

**Unauthorized use or deployment without proper authorization is prohibited.**

---

## 👨‍💻 Technical Details

- **Framework**: FastAPI 0.115.0
- **Python**: 3.10+
- **Database**: SQLite (development), PostgreSQL/MySQL recommended for production
- **Async Support**: Full async/await support
- **Validation**: Pydantic v2 for request/response validation
- **Documentation**: Auto-generated OpenAPI 3.0 schema

---

## 🎓 Educational Use

This system demonstrates:
- Clean FastAPI architecture
- RESTful API design
- Database abstraction layers
- Policy-based security monitoring
- Real-time alert systems
- Statistical data aggregation
- Production-ready code structure

Perfect for learning backend development, API design, and system monitoring concepts.

---

**Built with ❤️ for network administrators and security professionals**
