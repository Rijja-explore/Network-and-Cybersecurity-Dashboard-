
# 🔒 Network & Cybersecurity Dashboard

A professional, centralized network monitoring and policy enforcement system for educational institutions. Features real-time student activity tracking, domain/IP blocking, policy management, automated alerting, and a modern cybersecurity-themed dashboard. Built with FastAPI (backend) and React (frontend).

## ✨ Features

### 🛡️ Centralized Security Monitoring
- **Real-time Activity Tracking**: Monitor student system activity, network usage, and running processes
- **Live Dashboard**: Auto-refreshing view of all connected endpoints with bandwidth and app usage
- **Automated Policy Detection**: Instant flagging of unauthorized applications and policy violations
- **Alert Management**: Comprehensive alert system with severity levels and resolution workflow

### 🚫 Domain & Network Control
- **Domain Blocking**: Block access to unauthorized websites at the network level
- **IP/Firewall Management**: Windows Firewall integration for OS-level enforcement
- **Policy Configuration**: Manage allowed/blocked domain lists through admin UI
- **Keyword Monitoring**: Detect suspicious processes (torrent, proxy tools, hacking software)
- **Unblock Capability**: Reversible enforcement with full audit trail

### 📊 Analytics & Reporting
- **Weekly Statistics**: Bandwidth analysis, top consumers, alert trends
- **Interactive Charts**: Data visualization using Recharts (bandwidth, alerts, activity)
- **Policy Summary**: Real-time stats on blocked/allowed domains and active rules
- **Report Generation**: Exportable weekly security reports

### 🎨 Professional Cybersecurity UI
- **Dark Cyber Theme**: Modern dark theme with neon cyan/blue accents
- **Framer Motion Animations**: Smooth transitions and professional effects
- **Tabbed Interface**: Organized views for policies, firewall rules, alerts
- **Responsive Design**: Works across all screen sizes
- **Lucide Icons**: Modern, clean iconography


## 🏗️ Architecture

### Backend (FastAPI + SQLite)
- **Activity Ingestion**: Receives student data from Python agents via REST API
- **Policy Engine**: Automated detection of violations (blocked processes, bandwidth limits)
- **Alert System**: Real-time alert generation with severity levels
- **Domain Management**: Configurable allowed/blocked domain lists
- **Firewall Integration**: Windows Firewall control for network enforcement
- **Statistics Engine**: Weekly analytics and reporting
- **JWT Authentication**: Secure admin-only access
- **SQLite Database**: Efficient activity and alert storage

### Frontend (React + Tailwind + Framer Motion)
- **Dashboard**: Real-time overview with KPIs, charts, live activity table
- **Alerts Page**: Filter by severity/status, resolve alerts
- **Students/Endpoints**: View all connected machines with bandwidth data
- **Policy Management**: Configure domain policies, view firewall rules
- **Reports**: Generate weekly security reports
- **Modern Stack**: React 18, Vite, Tailwind CSS, Framer Motion, Lucide React

### Student Agent
- **Process Monitoring**: Collects running process names
- **Network Statistics**: Tracks bandwidth usage (bytes sent/received)
- **Auto-reporting**: Sends data to backend every 5 seconds
- **Lightweight**: Minimal system impact, runs in background

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Windows OS** (for firewall features)
- **Administrator privileges** (required for firewall operations)

### 1️⃣ Backend Setup

```powershell
# Navigate to Backend folder
cd Backend

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Backend will run on**: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/`

**Note**: Use `--host 0.0.0.0` to allow student agents on other machines to connect.

### 2️⃣ Frontend Setup

```powershell
# Navigate to Frontend folder
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```

**Frontend will run on**: `http://localhost:3000` (or next available port like 3001)

### 3️⃣ Login to Admin Dashboard

1. Open `http://localhost:3000` in your browser
2. Login with default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

### 4️⃣ Student Agent Setup (Optional - for testing)

**On Admin Machine** (for local testing):
```powershell
# Install agent dependencies
pip install psutil requests

# Run test agent
python test_student_agent.py
```

**On Student Machine** (for cross-laptop testing):
1. Create `student_agent.py` with the agent code
2. Update `ADMIN_SERVER_IP` to your admin machine's IP address
3. Install dependencies: `pip install psutil requests`
4. Run: `python student_agent.py`


## 📋 API Documentation

Once the backend is running, access the interactive API documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

#### 🔐 Authentication
```http
POST /auth/login          # Admin login (returns token)
```

#### 📡 Activity Monitoring
```http
POST /activity            # Student agent submits activity data
                          # Body: {
                          #   hostname: string,
                          #   timestamp: string,
                          #   bytes_sent: int,
                          #   bytes_recv: int,
                          #   processes: string[],
                          #   destinations: [
                          #     {ip: string, port: int, domain: string|null}
                          #   ]
                          # }
```

#### 🚨 Alerts Management
```http
GET  /alerts              # Get all alerts
GET  /alerts/active       # Get active (unresolved) alerts
POST /alerts/{id}/resolve # Resolve specific alert
```

#### 📊 Statistics & Analytics
```http
GET  /stats/weekly              # Weekly statistics with charts data
GET  /stats/bandwidth-summary   # Bandwidth analysis
GET  /stats/alerts-summary      # Alert statistics
```

#### 🛡️ Firewall Control (Admin, Windows Only)
```http
POST /firewall/block        # Block IP address
POST /firewall/block-domain # Block domain/website
POST /firewall/unblock      # Remove blocking rule
GET  /firewall/rules        # List active firewall rules
GET  /firewall/status       # Check firewall availability
```

#### 🌐 Policy Management
```http
GET    /policy/domains         # Get allowed/blocked domain lists
POST   /policy/domains/block   # Add domain to block list
POST   /policy/domains/allow   # Add domain to allow list
DELETE /policy/domains/{domain} # Remove domain from policies
GET    /policy/summary         # Get policy statistics
```

#### 👨‍💼 Admin Dashboard
```http
GET /admin/logs           # Get recent student activity logs (live monitoring)
                          # Returns formatted data for dashboard tables
```

## 🛠️ Development

### Backend Structure
```
Backend/
├── main.py                 # FastAPI app entry, router registration
├── config.py              # Configuration settings (blocked keywords, bandwidth threshold)
├── database.py            # SQLite operations (activities, alerts)
├── models.py              # Pydantic request/response models
├── alerts.py              # Policy violation detection engine
├── stats.py               # Statistics calculation engine
├── routers/
│   ├── __init__.py
│   ├── auth.py           # Admin authentication (JWT-ready)
│   ├── activity.py       # Student activity ingestion endpoint
│   ├── alerts.py         # Alert management endpoints
│   ├── stats.py          # Statistics and analytics endpoints
│   ├── firewall.py       # IP/domain blocking, firewall control
│   └── policy.py         # Domain policy management (NEW)
└── utils/
    └── time.py           # Time utilities
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx         # Top navigation bar
│   │   ├── Sidebar.jsx        # Side navigation menu
│   │   ├── StatCard.jsx       # KPI cards with animations
│   │   ├── AlertsTable.jsx    # Alerts display component
│   │   ├── StudentsTable.jsx  # Endpoint activity table
│   │   ├── RefreshTimer.jsx   # Auto-refresh countdown
│   │   ├── Loader.jsx         # Loading spinner
│   │   └── BlockButton.jsx    # Firewall block action
│   ├── pages/
│   │   ├── Login.jsx          # Admin login page
│   │   ├── Dashboard.jsx      # Main overview with live activity
│   │   ├── Alerts.jsx         # Alert management page
│   │   ├── Students.jsx       # Endpoint monitoring page
│   │   ├── NetworkHealth.jsx  # Policy & firewall management (NEW)
│   │   └── Reports.jsx        # Report generation page
│   ├── services/
│   │   └── api.js            # All backend API calls
│   ├── App.jsx               # Main app router
│   ├── main.jsx              # React entry point
│   └── index.css             # Tailwind + custom cyber theme
├── tailwind.config.js        # Tailwind customization
├── vite.config.js            # Vite build config
└── package.json              # Dependencies
```

### Student Agent Code Example
```python
import psutil
import socket
import requests
import time
from datetime import datetime

ADMIN_SERVER_IP = "10.70.248.252"  # Change to admin machine IP
ADMIN_SERVER_PORT = 8000
API_URL = f"http://{ADMIN_SERVER_IP}:{ADMIN_SERVER_PORT}/activity"
SEND_INTERVAL = 5  # seconds

def get_active_destinations():
    """Get active network destinations (IP + domain)"""
    destinations = []
    try:
        connections = psutil.net_connections(kind='inet')
        for conn in connections:
            if conn.raddr:  # Remote address exists
                ip = conn.raddr.ip
                port = conn.raddr.port
                try:
                    domain = socket.gethostbyaddr(ip)[0]
                except:
                    domain = None  # If DNS fails, only IP is sent
                
                destinations.append({
                    "ip": ip,
                    "port": port,
                    "domain": domain
                })
        return destinations
    except Exception as e:
        print("Error capturing destinations:", e)
        return []

def collect_system_data():
    net_info = psutil.net_io_counters()
    processes = [p.info['name'] for p in psutil.process_iter(['name'])][:25]
    
    return {
        "hostname": socket.gethostname(),
        "timestamp": str(datetime.now()),
        "bytes_sent": net_info.bytes_sent,
        "bytes_recv": net_info.bytes_recv,
        "processes": processes,
        "destinations": get_active_destinations()  # Network destinations
    }

def send_to_admin(data):
    try:
        response = requests.post(API_URL, json=data, timeout=5)
        if response.status_code == 200:
            print(f"[SENT] {datetime.now()}")
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    print("Student Agent Started\n")
    while True:
        collected = collect_system_data()
        if collected:
            send_to_admin(collected)
        time.sleep(SEND_INTERVAL)
```


### Configuration

Create `.env` file in `Backend/` directory (optional):
```env
# Application
APP_NAME=Department Network Monitoring Dashboard
APP_VERSION=1.0.0
DEBUG=True

# Database
DATABASE_PATH=./monitoring.db

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Policy Configuration
BANDWIDTH_THRESHOLD_MB=500
BLOCKED_KEYWORDS=torrent,proxy,nmap,wireshark,metasploit

# CORS (add frontend URL)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001
```

**Blocked Keywords**: Processes containing these keywords trigger alerts
**Bandwidth Threshold**: Network usage limit in MB (per session)

## 🧪 Testing

### Test Backend API
```powershell
cd Backend
python test_api.py
```

### Simulate Student Activity
Run the test agent to send sample data to the backend:
```powershell
python test_student_agent.py
```

This will:
- Send activity data every 5 seconds
- Randomly generate student hostnames
- Include various processes (some trigger alerts)
- Show confirmation messages in console

### Check Backend Logs
Watch the backend terminal for:
```
📥 Activity received: {...}
⚠️  Policy violation detected: ...
```

### View Data in Dashboard
1. Open `http://localhost:3000`
2. Go to **Dashboard** → See live activity table
3. Go to **Alerts** → See policy violations
4. Go to **Students** → See all endpoints
5. Go to **Network Health** → Manage policies

## 📦 Production Deployment

### Backend (Production Mode)

**Option 1: Uvicorn with multiple workers**
```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Option 2: Gunicorn (Linux)**
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (Production Build)

```powershell
cd frontend
npm run build      # Creates optimized build in dist/
npm run preview    # Test production build
```

Serve `dist/` folder with:
- **Netlify / Vercel**: Auto-deploy from Git
- **Nginx**: Serve static files + reverse proxy to backend
- **Apache**: VirtualHost configuration

### Environment Variables for Production
- Change `SECRET_KEY` to a strong random value
- Set `DEBUG=False`
- Update `ALLOWED_ORIGINS` to your production domain
- Use HTTPS in production
- Ensure firewall rules allow backend port (8000)


## � Usage Workflow

### Admin Workflow
1. **Monitor Activity**
   - Dashboard shows real-time student connections
   - View bandwidth usage, running apps, network destinations (domains/IPs)
   - See which websites/servers students are connecting to
   - Auto-refreshes every 30 seconds

2. **Manage Alerts**
   - Alerts page shows policy violations
   - Filter by severity (critical, high, medium, low)
   - Resolve alerts when addressed

3. **Block Websites & Enforce Policies**
   - Go to Network Health page
   - View student network destinations in Dashboard
   - Add suspicious domains to block list
   - Block domains via Windows Firewall (requires admin privileges)
   - Add domains to allow list
   - View and manage active firewall rules
   - Unblock domains when needed

4. **Analyze Trends**
   - View weekly statistics
   - Check top bandwidth consumers
   - Review alert distribution
   - Generate reports

### Student Agent Workflow
1. Agent runs on student machine
2. Collects:
   - Hostname
   - Network usage (bytes sent/received)
   - Running processes
   - Network destinations (IP addresses, ports, domains)
3. Sends data to backend every 5 seconds
4. Backend processes and stores data
5. Policy engine checks for violations
6. Alerts generated automatically
7. Admin can view destinations and block unwanted sites

## 🔒 Security & Legal Notice

This is a **legitimate network monitoring system** designed for:
- ✅ Educational institution network management
- ✅ Authorized administrative use by IT departments
- ✅ Policy enforcement in controlled environments
- ✅ Security incident detection and response

### Important Legal Considerations
⚠️ **Before deploying this system:**
- Obtain proper authorization from institution management
- Ensure compliance with local privacy laws and regulations
- Notify users about monitoring (as required by law)
- Use only in authorized educational/corporate environments
- Maintain proper audit trails and access logs
- Implement role-based access control
- Secure admin credentials

### What This System Does
✅ Monitors network usage metadata (bandwidth, domains)
✅ Tracks running processes on managed endpoints
✅ Enforces network access policies
✅ Generates security alerts for policy violations

### What This System Does NOT Do
❌ Does not decrypt HTTPS traffic
❌ Does not inspect packet contents
❌ Does not access private files or data
❌ Does not capture keystrokes or screenshots
❌ Does not monitor personal devices without consent

## 🎯 Key Features Breakdown

### Dashboard Page
- **Live Activity Table**: Shows all connected students with real-time data
- **KPI Cards**: Active endpoints, alerts, bandwidth, network status
- **Charts**: Bandwidth consumption, alert distribution
- **Auto-refresh**: Updates every 30 seconds

### Alerts Page
- **Alert Filters**: By severity (critical/high/medium/low) and status (active/resolved)
- **Search**: Find alerts by hostname or reason
- **Resolve**: Mark alerts as resolved with timestamp
- **Stats Summary**: Total, critical, high, medium alert counts

### Students/Endpoints Page
- **Endpoint List**: All active machines with hostname and IP
- **Running Processes**: See what apps are running on each endpoint
- **Bandwidth Usage**: Total data transferred by each machine
- **Actions**: Block IP addresses via firewall

### Network Health (Policy Management)
- **Domain Policies Tab**:
  - Add domains to block/allow lists
  - View all blocked and allowed domains
  - Apply firewall rules to domains
  - Manage blocked keywords
  
- **Firewall Rules Tab**:
  - View all active Windows Firewall rules created by system
  - Unblock resources with one click
  - See rule names and targets

### Reports Page
- Generate weekly security reports (PDF)
- View report history
- Download past reports

## 👥 Team & Project Structure

### Member 1 - Security Controller & Project Lead
**Responsibilities:**
- System architecture design
- Backend API development (FastAPI, routers)
- Policy engine and violation detection
- Domain/IP blocking implementation
- Firewall integration (Windows)
- Centralized policy enforcement
- JWT authentication structure
- Database design and operations

**Modules Owned:**
- `main.py`, `config.py`, `database.py`, `alerts.py`
- `routers/firewall.py`, `routers/policy.py`, `routers/auth.py`

### Member 2 - Activity Monitoring & Agent Development
**Responsibilities:**
- Student agent development
- Activity data collection (processes, network stats)
- Agent-backend communication
- Activity ingestion endpoints
- Real-time data transmission
- Cross-laptop testing

**Modules Owned:**
- `routers/activity.py`
- Student agent code (`student_agent.py`)
- Test scripts

### Member 3 - Frontend & User Experience
**Responsibilities:**
- React frontend development
- UI/UX design (cybersecurity theme)
- Dashboard and page components
- API integration service
- Framer Motion animations
- Responsive design
- Chart implementation (Recharts)

**Modules Owned:**
- All files in `frontend/src/`
- Components, pages, services
- Tailwind configuration and theming

## 🛠️ Troubleshooting

### Backend won't start
```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Try different port
uvicorn main:app --port 8080
```

### Firewall blocking doesn't work
- ✅ Backend must run as **Administrator**
- ✅ Only works on **Windows** OS
- ✅ Check Windows Firewall service is running

### Frontend can't connect to backend
- Check `API_BASE_URL` in `frontend/src/services/api.js`
- Ensure CORS origins include frontend URL
- Verify backend is running (`http://localhost:8000/`)

### Student agent can't connect
- Update `ADMIN_SERVER_IP` to correct admin machine IP
- Ensure backend uses `--host 0.0.0.0`
- Check firewall allows incoming connections on port 8000
- Test connection: `curl http://ADMIN_IP:8000/`

### No data showing in dashboard
- Run test agent to generate data: `python test_student_agent.py`
- Check backend logs for "📥 Activity received"
- Verify database file exists: `Backend/monitoring.db`

## 📄 License

This project is for **educational and authorized network monitoring purposes only**. 
Use responsibly and in compliance with applicable laws and regulations.

## 🤝 Support & Documentation

**Resources:**
- 📚 API Documentation: `http://localhost:8000/docs`
- 📖 Interactive API: `http://localhost:8000/redoc`
- 🐛 Check backend logs for debugging
- ✅ Ensure all dependencies installed
- 👑 Run with admin privileges for firewall features

**Project Documentation:**
- See `Backend/ARCHITECTURE.md` for system design
- See `Backend/QUICK_REFERENCE.md` for API quick reference
- See `Backend/PROJECT_SUMMARY.md` for overview

---

**⚡ Built with FastAPI, React, Tailwind CSS, Framer Motion, and Lucide React**  
**🔒 Professional Network Security Monitoring for Educational Institutions**