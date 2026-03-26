# 🔒 Network and Cybersecurity Dashboard

A comprehensive, production-grade monitoring solution for educational institutions to track network activity, detect policy violations, and provide real-time security analytics.


## 🎯 Overview

The Network and Cybersecurity Dashboard is a **legal, admin-controlled monitoring system** designed for college IT departments and security teams to:

- 📊 **Monitor** network activity on student machines
- 🚨 **Detect** policy violations in real-time
- 📈 **Generate** comprehensive security analytics
- 📋 **Track** alerts and incidents
- 📅 **Schedule** monitoring policies
- 📑 **Generate** detailed weekly and monthly reports

**Key Point**: This system focuses on process-level and usage-level monitoring. It does NOT involve packet sniffing or illegal surveillance.

---

## ✨ Features

### Backend Features
- ✅ **FastAPI** - Modern, high-performance REST API
- ✅ **Real-time Alerts** - Instant policy violation detection
- ✅ **Activity Tracking** - Comprehensive student machine monitoring
- ✅ **Statistical Analytics** - Weekly and monthly analytics
- ✅ **Firewall Rules** - Dynamic firewall policy management
- ✅ **Authentication** - JWT-based admin authentication
- ✅ **Bandwidth Monitoring** - Track network usage per student
- ✅ **Process Monitoring** - Monitor running processes for violations
- ✅ **Scheduled Tasks** - Cron-based monitoring schedules
- ✅ **SQLite Database** - Lightweight, file-based data storage

### Frontend Features
- 🎨 **Modern UI** - React 18 with Tailwind CSS
- 📊 **Interactive Charts** - Real-time data visualization with Recharts
- 🎯 **Dashboard** - At-a-glance network health overview
- 🚨 **Alerts Page** - Active and resolved alert management
- 👥 **Students Page** - Student machine tracking and status
- 📈 **Analytics** - Network usage and performance analytics
- 📋 **Reports** - Generate and download detailed reports
- 🔐 **Authentication** - Secure login interface
- ⚡ **Real-time Updates** - Auto-refresh capabilities
- 📱 **Responsive Design** - Works on desktop and tablet

---

## 📁 Project Structure

```
Network-and-Cybersecurity-Dashboard/
│
├── Backend/                          # Python FastAPI backend
│   ├── main.py                       # Application entry point
│   ├── config.py                     # Configuration & settings
│   ├── database.py                   # Database operations
│   ├── models.py                     # Pydantic data models
│   ├── alerts.py                     # Policy violation engine
│   ├── stats.py                      # Analytics engine
│   ├── firewall.py                   # Firewall management
│   ├── auth.py                       # Authentication logic
│   ├── migrate_db.py                 # Database migrations
│   │
│   ├── routers/                      # API routes
│   │   ├── activity.py               # Activity ingestion endpoints
│   │   ├── alerts.py                 # Alert management
│   │   ├── auth.py                   # Authentication endpoints
│   │   ├── commands.py               # Command execution endpoints
│   │   ├── firewall.py               # Firewall endpoints
│   │   ├── policy.py                 # Policy management
│   │   ├── reports_analytics.py      # Reports & analytics
│   │   ├── schedule.py               # Scheduled tasks
│   │   └── stats.py                  # Statistics endpoints
│   │
│   ├── services/                     # Business logic services
│   │   ├── analytics_service.py      # Analytics calculations
│   │   └── reports_service.py        # Report generation
│   │
│   ├── utils/                        # Utility functions
│   │   └── time.py                   # Time utilities
│   │
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment template
│   ├── policies.json                 # Default policies
│   ├── README.md                     # Backend documentation
│   ├── ARCHITECTURE.md               # Architecture details
│   ├── QUICK_REFERENCE.md            # Quick reference guide
│   ├── setup.ps1                     # Windows setup script
│   └── test_api.py                   # API tests
│
├── frontend/                         # React Vite frontend
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   │   ├── Dashboard.jsx         # Main dashboard
│   │   │   ├── Alerts.jsx            # Alerts page
│   │   │   ├── Analytics.jsx         # Analytics page
│   │   │   ├── Reports.jsx           # Reports page
│   │   │   ├── Students.jsx          # Student tracking
│   │   │   ├── NetworkHealth.jsx     # Network health
│   │   │   ├── Schedule.jsx          # Schedule management
│   │   │   └── Login.jsx             # Login page
│   │   │
│   │   ├── components/               # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── AlertsChart.jsx
│   │   │   ├── AlertsTable.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── SummaryCards.jsx
│   │   │   └── ... (more components)
│   │   │
│   │   ├── services/                 # API services
│   │   │   └── api.js                # Axios API client
│   │   │
│   │   ├── App.jsx                   # Root component
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Global styles
│   │
│   ├── package.json                  # Node dependencies
│   ├── vite.config.js                # Vite configuration
│   ├── tailwind.config.js            # Tailwind configuration
│   ├── postcss.config.js             # PostCSS configuration
│   └── README.md                     # Frontend documentation
│
├── reports_analytics/                # Reporting module
│   ├── backend/                      # Backend for reports
│   │   ├── main.py
│   │   ├── reports.py
│   │   └── mock_data/
│   │
│   └── frontend/                     # Frontend for reports
│       └── src/
│
├── scripts/                          # Utility scripts
│   └── integration_test.py           # Integration tests
│
├── .gitignore                        # Git ignore rules
├── package.json                      # Root package configuration
└── README.md                         # This file
```

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.115.0
- **Server**: Uvicorn 0.30.6
- **Database**: SQLite
- **Authentication**: JWT with python-jose
- **Validation**: Pydantic 2.9.2
- **Password Hashing**: bcrypt via passlib
- **Environment Config**: python-dotenv

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **Styling**: Tailwind CSS 3.3.6
- **Routing**: React Router DOM 6.20.0
- **HTTP Client**: Axios 1.6.2
- **Charts**: Recharts 2.10.3
- **Icons**: Lucide React 0.563.0
- **Animations**: Framer Motion 12.34.0
- **PDF Export**: jsPDF 4.2.0, html2canvas 1.4.1

---

## 🚀 Quick Start

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 16.0 or higher (for frontend)
- **npm**: 7.0 or higher
- **Git**: 2.0 or higher

### Clone the Repository
```bash
git clone https://github.com/yourusername/Network-and-Cybersecurity-Dashboard.git
cd Network-and-Cybersecurity-Dashboard
```

### Backend Setup (Windows)
```powershell
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env

# Run migrations (if needed)
python migrate_db.py

# Start backend server
python main.py
```

### Backend Setup (Linux/Mac)
```bash
cd Backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Run migrations (if needed)
python migrate_db.py

# Start backend server
python main.py
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## ⚙️ Installation

### Full Installation with Automation (Windows)

The project includes a PowerShell setup script to automate the installation:

```powershell
cd Backend
.\setup.ps1
```

This script will:
- Create a Python virtual environment
- Install all backend dependencies
- Create necessary `.env` file
- Initialize the database
- Provide startup instructions

### Manual Installation

#### Option 1: Backend Only

1. Navigate to Backend directory:
   ```bash
   cd Backend
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate.ps1  # Windows
   source venv/bin/activate      # Linux/Mac
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment:
   ```bash
   copy .env.example .env         # Windows
   cp .env.example .env           # Linux/Mac
   ```

#### Option 2: Frontend Only

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

#### Option 3: Full Stack

Repeat both options above in separate terminals.

---

## 🔧 Configuration

### Environment Variables (Backend)

Create a `.env` file in the `Backend/` directory:

```env
# Flask/FastAPI Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_PATH=monitoring.db

# CORS
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# Policy Settings
BANDWIDTH_THRESHOLD_GB=10
BLOCKED_KEYWORDS=torrent,proxy,nmap,wireshark,metasploit
```

### Frontend Configuration

Frontend environment variables are set in `frontend/.env` (if needed):

```env
VITE_API_URL=http://localhost:8000
```

---

## ▶️ Running the Application

### Option 1: Separate Terminals

**Terminal 1 - Backend:**
```bash
cd Backend
.\venv\Scripts\Activate.ps1  # Activate if not already
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open your browser to `http://localhost:5173`

### Option 2: Using VS Code Terminal

Open VS Code and use the integrated terminal:

1. Split terminal (click split icon)
2. Terminal 1:
   ```bash
   cd Backend && .\venv\Scripts\Activate.ps1 && python main.py
   ```
3. Terminal 2:
   ```bash
   cd frontend && npm run dev
   ```

### Accessing the Application

- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

---

## 📚 API Documentation

### Available Endpoints

The fastapi implementation provides comprehensive REST APIs. Full documentation is available at `/docs` (Swagger UI) when the server is running.

#### Activity Endpoints
```
POST   /activity                    # Submit student machine activity
```

#### Alert Endpoints
```
GET    /alerts                      # Fetch all alerts
GET    /alerts/active               # Fetch active alerts
PATCH  /alerts/{id}/resolve         # Resolve an alert
```

#### Statistics Endpoints
```
GET    /stats/weekly                # Weekly statistics
GET    /stats/bandwidth-summary     # Bandwidth overview
GET    /stats/alerts-summary        # Alert statistics
GET    /stats/top-consumers         # Top bandwidth users
```

#### Authentication Endpoints
```
POST   /auth/login                  # User login
POST   /auth/register               # User registration (admin only)
```

#### Additional Endpoints
See full documentation in [Backend/README.md](Backend/README.md)

---

## 👨‍💻 Development

### Backend Development

1. **Activate virtual environment**:
   ```bash
   cd Backend
   .\venv\Scripts\Activate.ps1
   ```

2. **Install in development mode**:
   ```bash
   pip install -r requirements.txt -e .
   ```

3. **Run with auto-reload**:
   ```bash
   python main.py
   ```

4. **Run tests**:
   ```bash
   python test_api.py
   ```

### Frontend Development

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start dev server** (with hot reload):
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

### Code Style

- **Backend**: Follow PEP 8 guidelines
- **Frontend**: Use ESLint and Prettier for consistency

---

## 🧪 Testing

### Test Backend API

```bash
cd Backend
python test_api.py
```

### Test with cURL

```bash
# Health check
curl http://localhost:8000/

# Submit activity
curl -X POST http://localhost:8000/activity \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "STUDENT-01",
    "bandwidth_used_mb": 500,
    "processes": ["chrome.exe", "torrent.exe"]
  }'

# Get active alerts
curl http://localhost:8000/alerts/active
```

---

## 📄 Additional Documentation

- [Backend README](Backend/README.md) - Detailed backend documentation
- [Architecture Guide](Backend/ARCHITECTURE.md) - System architecture details
- [Quick Reference](Backend/QUICK_REFERENCE.md) - Common commands
- [Frontend README](frontend/README.md) - Frontend documentation

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For issues, questions, or suggestions:

1. Check existing [GitHub Issues](https://github.com/yourusername/issues)
2. Create a new issue with detailed description
3. Include error logs and reproduction steps

---

## 🔐 Security Notice

This project is designed for **legitimate educational monitoring** only. Usage must comply with:

- Local and federal privacy laws
- Educational institution policies
- FERPA (Family Educational Rights and Privacy Act) requirements
- Explicit user consent and disclosure

**Unauthorized monitoring is illegal.**

---

**Last Updated**: March 26, 2026
