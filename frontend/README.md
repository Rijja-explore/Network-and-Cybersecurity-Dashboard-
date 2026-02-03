# SOC Dashboard - Network Monitoring & Cybersecurity

A professional Security Operations Center (SOC) dashboard for department network monitoring and cybersecurity management.

## 🛡️ Features

### Core Functionality

- **Real-time Network Monitoring** - Live bandwidth tracking and network health status
- **Security Alerts Management** - Categorized alerts with severity filtering
- **Endpoint Management** - Monitor and block student/endpoint connections
- **Automated Reports** - Generate weekly security and network reports
- **Auto-refresh System** - 5-second countdown with manual refresh option

### Pages

1. **Login** - Admin authentication (username: `admin`, password: `password`)
2. **Dashboard** - KPI overview with bandwidth trends
3. **Network Health** - Real-time charts and health status
4. **Security Alerts** - Alert table with severity filtering
5. **Endpoints/Students** - Active connections with block functionality
6. **Reports** - Weekly report generation and history

## 🎨 Design

**SOC-Grade Dark Theme:**

- Background: `#0b1220` (dark navy)
- Cards: `#111827`
- Primary Text: `#e5e7eb`
- Accent Blue: `#38bdf8`
- Warning Yellow: `#facc15`
- Alert Red: `#ef4444`
- Success Green: `#22c55e`

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open browser at `http://localhost:3000`

### Backend Configuration

Update the API base URL in [src/services/api.js](src/services/api.js):

```javascript
const API_BASE_URL = "http://localhost:8000/api"; // Update to your backend URL
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx          # Navigation sidebar
│   ├── Navbar.jsx           # Top navigation bar
│   ├── StatCard.jsx         # KPI card component
│   ├── AlertsTable.jsx      # Security alerts table
│   ├── StudentsTable.jsx    # Endpoints table
│   ├── BlockButton.jsx      # Block endpoint button with confirmation
│   ├── RefreshTimer.jsx     # Auto-refresh countdown timer
│   └── Loader.jsx           # Loading spinner
├── pages/
│   ├── Login.jsx            # Admin login page
│   ├── Dashboard.jsx        # Main dashboard overview
│   ├── NetworkHealth.jsx    # Network monitoring page
│   ├── Alerts.jsx           # Security alerts page
│   ├── Students.jsx         # Endpoints management page
│   └── Reports.jsx          # Reports generation page
├── services/
│   └── api.js               # Axios API service layer
├── App.jsx                  # Main app with routing
├── main.jsx                 # React entry point
└── index.css                # Global styles with Tailwind
```

## 🔌 API Endpoints

The frontend expects these backend endpoints:

- `POST /api/login` - Admin authentication
- `GET /api/dashboard` - Dashboard KPIs
- `GET /api/students` - List all endpoints
- `GET /api/alerts` - Security alerts
- `GET /api/network-health` - Network metrics
- `POST /api/block/{ip}` - Block endpoint by IP
- `GET /api/reports/generate` - Generate PDF report

## 🎯 Key Features

### Auto-Refresh System

- 5-second countdown timer on all data pages
- Manual refresh button available
- Automatic data fetching on countdown completion

### Security Alerts

- Color-coded severity (Critical/Warning/Info)
- Real-time filtering by severity level
- Detailed alert information table

### Endpoint Management

- View active connections and processes
- Monitor bandwidth usage per endpoint
- Block endpoints with confirmation modal
- Real-time last-seen timestamps

### Network Health

- Live bandwidth usage charts
- Active systems count visualization
- Health status indicator (Healthy/Warning/Critical)
- Network metrics dashboard

## 🛠️ Tech Stack

- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Chart library
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Build tool and dev server

## 📝 Default Login Credentials

- **Username:** `admin`
- **Password:** `password`

## 🔒 Authentication

- JWT token-based authentication
- Protected routes with automatic redirect
- Token stored in localStorage
- Logout functionality on all pages

## 📊 Charts & Visualizations

- **Line Charts** - Bandwidth trends over time
- **Bar Charts** - Active systems count
- **KPI Cards** - Real-time statistics
- All charts use Recharts with SOC color theme

## 🎨 Styling Guidelines

- Dark theme throughout
- Consistent border-radius and shadows
- Hover effects on interactive elements
- Color-coded status indicators
- Responsive grid layouts

## 🚦 Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

## 📄 License

MIT License - Academic & Industry Demo Project

## 👥 Team

Frontend Developer - SOC Dashboard Implementation

---

**© 2026 Department Network Monitoring System**
