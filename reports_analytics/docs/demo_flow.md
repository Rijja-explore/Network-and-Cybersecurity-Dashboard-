# Demo Flow Documentation
## Network Health & Cybersecurity Monitoring Dashboard
### Reports & Analytics Module

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FULL SYSTEM (Future)                         │
├─────────────────────────────────────────────────────────────────────┤
│  Student Agents  →  Main Backend API  →  Admin Dashboard            │
│        ↓                   ↓                    ↓                   │
│  Send Activity        Store in DB         Display Live Data         │
│                            ↓                                        │
│              ┌─────────────────────────────┐                       │
│              │   REPORTS & ANALYTICS       │  ← YOUR MODULE        │
│              │   (This Implementation)     │                       │
│              └─────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Current Implementation (Standalone)

```
┌──────────────────┐     HTTP/REST      ┌──────────────────┐
│   React Frontend │ ←───────────────→  │  FastAPI Backend │
│   (Port 3000)    │                    │  (Port 8000)     │
├──────────────────┤                    ├──────────────────┤
│ • AnalyticsDash  │                    │ • /analytics/*   │
│ • ReportsPage    │                    │ • /reports/*     │
│ • Charts/Tables  │                    │ • mock_data/     │
└──────────────────┘                    └──────────────────┘
```

---

## 2. Data Flow Diagram

### Analytics Data Flow

```
1. MOCK DATA LAYER
   mock_activity.json  ──┐
   mock_alerts.json    ──┼──→  analytics.py (Processing)
                                    │
2. PROCESSING LAYER               │
   • calculate_summary()     ←────┘
   • get_network_chart_data()
   • get_alerts_chart_data()
                │
3. API LAYER    ↓
   main.py ─────────→  REST Endpoints
   • GET /analytics/summary
   • GET /analytics/charts/network
   • GET /analytics/charts/alerts
                │
4. FRONTEND     ↓
   api.js (axios) ──→ React Components
   • SummaryCards
   • NetworkUsageChart
   • AlertsChart
```

### Reports Data Flow

```
1. mock_data/ ──→ reports.py
                      │
2. generate_weekly_report()
   • Executive Summary
   • Network Analysis
   • Security Alerts
   • Student Activity
   • Recommendations
                │
3. GET /reports/weekly ──→ Frontend
                              │
4. WeeklyReportTable Component
   • Summary View
   • Network Details
   • Alerts Breakdown
   • Student List
   • Action Items
```

---

## 3. API Endpoints Reference

### Analytics Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/analytics/summary` | GET | Dashboard metrics | JSON with alerts, users, bandwidth |
| `/analytics/charts/network` | GET | Network chart data | Time series, per-student data |
| `/analytics/charts/alerts` | GET | Alerts chart data | By type, severity, daily trend |

### Reports Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/reports/weekly` | GET | Weekly report data | Comprehensive JSON report |
| `/reports/weekly/csv` | GET | CSV export | File download |

---

## 4. Demo Walkthrough

### Step 1: Start Backend Server
```bash
cd reports_analytics/backend
pip install fastapi uvicorn
uvicorn main:app --reload --port 8000
```
Visit http://localhost:8000/docs for Swagger UI

### Step 2: Start Frontend
```bash
cd reports_analytics/frontend
npm install
npm run dev
```
Visit http://localhost:3000

### Step 3: Demonstrate Dashboard Features

1. **Summary Cards**
   - Total alerts count (with critical highlighted)
   - Active users count
   - Total bandwidth usage
   - Top application

2. **Network Usage Chart**
   - Switch between Timeline, By Student, Hourly views
   - Hover for detailed tooltips
   - Show bandwidth patterns

3. **Alerts Chart**
   - Severity distribution (pie chart)
   - Alert types (bar chart)
   - Daily trend (line chart)
   - Recent alerts list

### Step 4: Demonstrate Reports Page

1. Navigate to `/reports`
2. Show section tabs:
   - Summary (health status, key metrics)
   - Network (bandwidth analysis)
   - Alerts (security breakdown)
   - Students (per-user details)
   - Actions (recommendations)
3. Download CSV export

---

## 5. Future Integration Points

### Connecting to Real Backend

**Current (Mock):**
```python
def load_mock_data(filename):
    with open(filepath) as f:
        return json.load(f)
```

**Future (Database):**
```python
async def get_activities(db: Session):
    return db.query(Activity).all()
```

### Frontend API Changes
```javascript
// Current: Local analytics service
const BASE_URL = 'http://localhost:8000';

// Future: Main backend
const BASE_URL = 'http://main-backend:8000/api/analytics';
```

### Adding PDF Export

1. Backend: Install reportlab/weasyprint
2. Create PDF template
3. Add endpoint:
```python
@app.get("/reports/weekly/pdf")
async def download_pdf():
    report = generate_weekly_report()
    pdf_bytes = create_pdf(report)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf"
    )
```

---

## 6. Integration Checklist

When connecting to main system:

- [ ] Replace mock data with database queries
- [ ] Update CORS settings for production URLs
- [ ] Add authentication middleware
- [ ] Implement real-time updates (WebSocket)
- [ ] Add date range filtering
- [ ] Enable PDF export
- [ ] Add report scheduling
- [ ] Connect to notification system

---

## 7. Team Integration Guide

### For Backend Team
1. Ensure database tables match mock data structure
2. Expose endpoints at agreed-upon paths
3. Return data in same JSON format

### For Frontend Team  
1. Import analytics components into main dashboard
2. Update API base URL in services/api.js
3. Add navigation links in main sidebar

### For Student Agent Team
1. Ensure activity data matches schema:
   - student_id, timestamp, bandwidth_used
   - running_applications, ip_address

---

## 8. Demo Script (5 minutes)

1. **Introduction** (30s)
   "This is the Reports & Analytics module for our cybersecurity dashboard."

2. **Show Backend** (1m)
   - Show API docs at /docs
   - Execute sample endpoint
   - Explain mock data structure

3. **Show Dashboard** (2m)
   - Walk through summary cards
   - Demonstrate chart interactions
   - Show data refresh

4. **Show Reports** (1m)
   - Navigate sections
   - Download CSV

5. **Explain Integration** (30s)
   - Show where to change from mock to real data
   - Mention future features (PDF, scheduling)

---

*Document Version: 1.0*
*Last Updated: February 2026*
*Module: Reports & Analytics (Member 5)*
