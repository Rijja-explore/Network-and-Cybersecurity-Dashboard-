# Reports & Analytics Integration Plan
## Network Cybersecurity Dashboard - Safe Module Integration

---

## 📊 Current State Analysis

### Main Project Structure (WORKING - DO NOT BREAK)
```
Network-and-Cybersecurity-Dashboard-/
├── Backend/                    ✅ FastAPI backend (working)
│   ├── main.py                 (includes routers)
│   ├── routers/                (activity, alerts, stats, firewall, auth, policy, commands)
│   └── database.py             (uses monitoring.db)
│
├── frontend/                   ✅ React/Vite frontend (working)
│   ├── src/
│   │   ├── App.jsx            (routes: /dashboard, /alerts, /students, /reports)
│   │   └── components/
│   └── package.json
│
└── monitoring.db              ✅ SQLite database (active)
```

### Reports Analytics Module (TO BE INTEGRATED)
```
reports_analytics/
├── backend/
│   ├── main.py                ❌ Separate FastAPI server (port conflict risk)
│   ├── reports.py             ✅ Report generation logic
│   └── analytics.py           ❌ MISSING FILE (imported but doesn't exist!)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            ❌ Duplicate routing structure
│   │   ├── pages/             ✅ AnalyticsDashboard.jsx, ReportsPage.jsx
│   │   └── components/        ✅ Charts, tables (to be moved)
│   └── package.json           ❌ Duplicate config
│
└── docs/                      ✅ Documentation (keep for reference)
```

---

## 🎯 Integration Goals

1. **Single Backend**: Merge reports endpoints into `Backend/main.py`
2. **Single Frontend**: Integrate analytics pages into existing `frontend/src/`
3. **No Breaking Changes**: Existing functionality remains intact
4. **Database Connection**: Use existing `monitoring.db` instead of mock data
5. **Clean Structure**: Remove duplicate configs and nested apps

---

## 🚨 Critical Issues Found

### Issue 1: Missing `analytics.py` Module
**Problem**: `reports_analytics/backend/main.py` imports from `analytics`:
```python
from analytics import (
    calculate_summary,
    get_network_chart_data,
    get_alerts_chart_data
)
```
But this file **does not exist** in the reports_analytics/backend folder.

**Solution**: We need to create this module with functions that query the real database.

### Issue 2: Duplicate Routes
**Problem**: Main frontend already has `/reports` route, but it's a different implementation than the analytics module's reports page.

**Solution**: 
- Current `/reports` can become `/reports/export` (PDF generation)
- New analytics becomes `/reports/analytics` or `/analytics`

### Issue 3: Mock Data vs Real Database
**Problem**: Reports analytics uses mock JSON files instead of querying `monitoring.db`.

**Solution**: Replace mock data functions with real database queries.

---

## 📁 Proposed Final Architecture

```
Network-and-Cybersecurity-Dashboard-/
│
├── Backend/
│   ├── main.py                        (unchanged except new router)
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   │
│   ├── routers/
│   │   ├── activity.py                (existing)
│   │   ├── alerts.py                  (existing)
│   │   ├── stats.py                   (existing)
│   │   ├── firewall.py                (existing)
│   │   ├── auth.py                    (existing)
│   │   ├── policy.py                  (existing)
│   │   ├── commands.py                (existing)
│   │   └── reports_analytics.py       ✨ NEW - merged endpoints
│   │
│   └── services/                      ✨ NEW FOLDER
│       ├── __init__.py
│       ├── analytics_service.py       ✨ NEW - calculate_summary, etc.
│       └── reports_service.py         ✨ NEW - generate_weekly_report
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    (updated with new route)
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          (existing)
│   │   │   ├── Alerts.jsx             (existing)
│   │   │   ├── Students.jsx           (existing)
│   │   │   ├── Reports.jsx            (existing - PDF export)
│   │   │   ├── Analytics.jsx          ✨ NEW - moved from reports_analytics
│   │   │   └── ReportsAnalytics.jsx   ✨ NEW - moved from reports_analytics
│   │   │
│   │   └── components/
│   │       ├── AlertsTable.jsx        (existing)
│   │       ├── SummaryCards.jsx       ✨ NEW - from reports_analytics
│   │       ├── NetworkUsageChart.jsx  ✨ NEW - from reports_analytics
│   │       ├── AlertsChart.jsx        ✨ NEW - from reports_analytics
│   │       └── WeeklyReportTable.jsx  ✨ NEW - from reports_analytics
│   │
│   └── package.json                   (existing)
│
├── monitoring.db                      (existing)
├── reports_analytics/                 ⚠️  TO BE ARCHIVED
│   └── docs/                          (keep for reference)
│
└── INTEGRATION_PLAN.md                (this file)
```

---

## 🔧 Detailed File Migration Plan

### Backend Changes

#### Step 1: Create Analytics Service
**New File**: `Backend/services/analytics_service.py`

```python
"""
Analytics Service
Provides data aggregation and analytics calculations from monitoring.db
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any
from collections import defaultdict
from ..database import db

def calculate_summary() -> Dict[str, Any]:
    """Calculate summary analytics from database."""
    # Query real database instead of mock data
    activities = db.get_recent_activities(limit=1000)
    alerts = db.get_recent_alerts(limit=1000)
    
    # Calculate metrics
    total_bandwidth = sum(
        (a['bytes_sent'] + a['bytes_recv']) / (1024 * 1024) 
        for a in activities
    )
    unique_students = len(set(a['student_id'] for a in activities))
    
    # Alert breakdown
    alert_counts = defaultdict(int)
    for alert in alerts:
        alert_counts[alert['severity']] += 1
    
    return {
        "total_alerts": len(alerts),
        "alerts_by_severity": {
            "critical": alert_counts.get('critical', 0),
            "warning": alert_counts.get('warning', 0),
            "info": alert_counts.get('info', 0)
        },
        "active_users": unique_students,
        "total_bandwidth_mb": round(total_bandwidth, 2),
        "avg_bandwidth_mb": round(total_bandwidth / len(activities), 2) if activities else 0
    }

def get_network_chart_data() -> Dict[str, Any]:
    """Get network usage data formatted for charts."""
    activities = db.get_recent_activities(limit=1000)
    
    # Time series data
    daily_data = defaultdict(float)
    for activity in activities:
        date = activity['timestamp'][:10]
        bandwidth_mb = (activity['bytes_sent'] + activity['bytes_recv']) / (1024 * 1024)
        daily_data[date] += bandwidth_mb
    
    time_series = [
        {"timestamp": date, "bandwidth": round(bw, 2)}
        for date, bw in sorted(daily_data.items())
    ]
    
    # Per-student data
    student_data = defaultdict(float)
    for activity in activities:
        bandwidth_mb = (activity['bytes_sent'] + activity['bytes_recv']) / (1024 * 1024)
        student_data[activity['student_id']] += bandwidth_mb
    
    per_student = [
        {"student_id": sid, "bandwidth": round(bw, 2)}
        for sid, bw in sorted(student_data.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    return {
        "time_series": time_series,
        "per_student": per_student
    }

def get_alerts_chart_data() -> Dict[str, Any]:
    """Get alerts data formatted for charts."""
    alerts = db.get_recent_alerts(limit=1000)
    
    # By severity
    severity_counts = defaultdict(int)
    for alert in alerts:
        severity_counts[alert['severity']] += 1
    
    by_severity = [
        {"severity": sev, "count": count}
        for sev, count in severity_counts.items()
    ]
    
    # By type
    type_counts = defaultdict(int)
    for alert in alerts:
        type_counts[alert.get('violation_type', 'unknown')] += 1
    
    by_type = [
        {"type": typ, "count": count}
        for typ, count in type_counts.items()
    ]
    
    return {
        "by_severity": by_severity,
        "by_type": by_type,
        "total_alerts": len(alerts)
    }
```

#### Step 2: Create Reports Service
**New File**: `Backend/services/reports_service.py`

Move content from `reports_analytics/backend/reports.py` but update to use real database:

```python
"""
Reports Service
Generates comprehensive weekly/monthly reports
"""
from datetime import datetime, timedelta
from typing import Dict, Any
from .analytics_service import get_activity_data_from_db, get_alerts_data_from_db

def generate_weekly_report(start_date: datetime = None, end_date: datetime = None) -> Dict[str, Any]:
    """Generate comprehensive weekly report using real database."""
    # Use real database queries instead of mock data
    activities = get_activity_data_from_db(start_date, end_date)
    alerts = get_alerts_data_from_db(start_date, end_date)
    
    # ... rest of report generation logic ...
```

#### Step 3: Create Reports Analytics Router
**New File**: `Backend/routers/reports_analytics.py`

```python
"""
Reports & Analytics Router
Provides endpoints for advanced analytics and report generation
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..services.analytics_service import (
    calculate_summary,
    get_network_chart_data,
    get_alerts_chart_data
)
from ..services.reports_service import generate_weekly_report

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics & Reports"]
)

@router.get("/summary")
async def get_analytics_summary() -> Dict[str, Any]:
    """Get summary analytics for dashboard."""
    try:
        summary = calculate_summary()
        return {"success": True, "data": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/charts/network")
async def get_network_charts() -> Dict[str, Any]:
    """Get network usage chart data."""
    try:
        chart_data = get_network_chart_data()
        return {"success": True, "data": chart_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/charts/alerts")
async def get_alert_charts() -> Dict[str, Any]:
    """Get alerts chart data."""
    try:
        chart_data = get_alerts_chart_data()
        return {"success": True, "data": chart_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/weekly")
async def get_weekly_report() -> Dict[str, Any]:
    """Get comprehensive weekly report."""
    try:
        report = generate_weekly_report()
        return {"success": True, "data": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### Step 4: Register Router in Main Backend
**Update**: `Backend/main.py`

```python
# Add to imports at top
from routers.reports_analytics import router as reports_analytics_router

# Add to router registration section (around line 443)
app.include_router(reports_analytics_router)
```

---

### Frontend Changes

#### Step 1: Move Components
**Copy these files from `reports_analytics/frontend/src/components/` to `frontend/src/components/`:**

- `SummaryCards.jsx`
- `NetworkUsageChart.jsx`
- `AlertsChart.jsx`
- `WeeklyReportTable.jsx`

**Note**: Check for naming conflicts with existing components.

#### Step 2: Move Pages
**Copy these files from `reports_analytics/frontend/src/pages/` to `frontend/src/pages/`:**

- `AnalyticsDashboard.jsx` → Rename to `Analytics.jsx`
- `ReportsPage.jsx` → Rename to `ReportsAnalytics.jsx`

#### Step 3: Update API Service
**Update**: `frontend/src/services/api.js`

Add analytics endpoints:

```javascript
// Analytics endpoints
export const analyticsAPI = {
  getSummary: () => api.get('/api/analytics/summary'),
  getNetworkCharts: () => api.get('/api/analytics/charts/network'),
  getAlertsCharts: () => api.get('/api/analytics/charts/alerts'),
};

export const reportsAPI = {
  getWeeklyReport: () => api.get('/api/analytics/reports/weekly'),
  downloadWeeklyCSV: async () => {
    const response = await api.get('/api/analytics/reports/weekly/csv', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `weekly_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
```

#### Step 4: Update App.jsx Routing
**Update**: `frontend/src/App.jsx`

Add new route for analytics dashboard:

```javascript
import Analytics from './pages/Analytics';
import ReportsAnalytics from './pages/ReportsAnalytics';

// Add inside Routes (keep existing Reports route)
<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <Analytics />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/reports/analytics"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <ReportsAnalytics />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
```

#### Step 5: Update Sidebar Navigation
**Update**: `frontend/src/components/Sidebar.jsx`

Add analytics menu item:

```javascript
import { BarChart } from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/network-health', icon: Activity, label: 'Network Health' },
  { path: '/alerts', icon: AlertTriangle, label: 'Security Alerts' },
  { path: '/students', icon: Users, label: 'Endpoints' },
  { path: '/analytics', icon: BarChart, label: 'Analytics' },  // NEW
  { path: '/reports', icon: FileText, label: 'Reports' },
];
```

---

## 🚀 Step-by-Step Integration Process

### Phase 1: Backend Integration (No Breaking Changes)

```powershell
# Navigate to Backend directory
cd Backend

# Create services folder
mkdir services
New-Item -Path "services/__init__.py" -ItemType File

# Create analytics service (copy content from plan above)
# Create reports service (adapt from reports_analytics/backend/reports.py)

# Create new router (copy content from plan above)
# Copy: reports_analytics/backend/reports.py → Backend/routers/reports_analytics.py

# Test the backend still works
cd ..
.venv\Scripts\Activate.ps1
cd Backend
uvicorn main:app --reload --port 8001
```

**Verify**: 
- Visit http://localhost:8001/docs 
- Check all existing endpoints still work
- Check new `/api/analytics/*` endpoints appear

### Phase 2: Frontend Integration (Additive Only)

```powershell
# Navigate to frontend
cd frontend

# Copy components
Copy-Item "../reports_analytics/frontend/src/components/SummaryCards.jsx" "src/components/"
Copy-Item "../reports_analytics/frontend/src/components/NetworkUsageChart.jsx" "src/components/"
Copy-Item "../reports_analytics/frontend/src/components/AlertsChart.jsx" "src/components/"
Copy-Item "../reports_analytics/frontend/src/components/WeeklyReportTable.jsx" "src/components/"

# Copy pages (with rename)
Copy-Item "../reports_analytics/frontend/src/pages/AnalyticsDashboard.jsx" "src/pages/Analytics.jsx"
Copy-Item "../reports_analytics/frontend/src/pages/ReportsPage.jsx" "src/pages/ReportsAnalytics.jsx"

# Update API service (add new functions)
# Update App.jsx (add new routes)
# Update Sidebar.jsx (add analytics menu item)

# Test frontend
npm run dev
```

**Verify**:
- Visit http://localhost:5173
- Check all existing pages still work
- Navigate to new `/analytics` page
- Verify data loads from backend

### Phase 3: Component Updates

Update the moved components to:
1. Use correct API base URL
2. Match existing dashboard styling
3. Integrate with existing Navbar/Sidebar
4. Update imports for new component locations

### Phase 4: Testing & Cleanup

```powershell
# Test all functionality
# 1. Test existing dashboard pages
# 2. Test new analytics pages
# 3. Test data consistency
# 4. Test all API endpoints

# If everything works, archive old module
cd ..
mkdir archived_modules
Move-Item "reports_analytics" "archived_modules/reports_analytics_BACKUP_$(Get-Date -Format 'yyyyMMdd')"
```

---

## ⚠️ Risk Mitigation

### Before Starting
1. **Backup everything**: Create a full backup of the project
2. **Git commit**: Commit all current changes
3. **Test current system**: Verify everything works before integration

### During Integration
1. **One phase at a time**: Do backend first, test, then frontend
2. **Keep old code**: Don't delete `reports_analytics/` until fully verified
3. **Test continuously**: After each file change, test the system

### Rollback Plan
If anything breaks:
```powershell
# Restore from git
git checkout Backend/main.py
git checkout frontend/src/App.jsx

# Or restore from backup
Copy-Item "backup/Backend" "Backend" -Recurse -Force
```

---

## 🧪 Testing Checklist

### Backend Testing
- [ ] Existing health endpoint works (`/`)
- [ ] Existing activity endpoints work (`/api/activity/*`)
- [ ] Existing alerts endpoints work (`/api/alerts/*`)
- [ ] New analytics summary works (`/api/analytics/summary`)
- [ ] New charts endpoints work (`/api/analytics/charts/*`)
- [ ] New reports endpoint works (`/api/analytics/reports/weekly`)

### Frontend Testing
- [ ] Login page works
- [ ] Dashboard page works
- [ ] Network Health page works
- [ ] Alerts page works
- [ ] Students page works
- [ ] Existing Reports page works
- [ ] New Analytics page loads
- [ ] Charts render correctly
- [ ] Data refreshes properly
- [ ] Navigation works

---

## 📝 Post-Integration Tasks

1. **Update Dependencies**: Check if any new packages are needed
2. **Update Documentation**: Update README with new features
3. **Remove Duplicate Files**: Archive `reports_analytics/` folder
4. **Update Environment Variables**: Add any new config needed
5. **Database Migrations**: If schema changes required
6. **Performance Testing**: Ensure no slowdowns
7. **Security Review**: Check new endpoints have proper auth

---

## 🔑 Key Success Indicators

✅ **Successful Integration Means:**
- All existing pages work without any issues
- New analytics pages accessible and functional
- Single backend server (no port conflicts)
- Single frontend app (no duplicate configs)
- Real database data (no mock data)
- Clean project structure (no nested apps)
- All tests pass

---

## 📞 Need Help?

If you encounter issues during integration:
1. Check error logs in browser console and terminal
2. Verify API endpoint URLs match between frontend and backend
3. Check database connection is working
4. Ensure all imports are correct
5. Test endpoints individually in Swagger UI (`/docs`)

---

## Summary

This plan provides a **safe, incremental, and reversible** integration strategy that:
- **Preserves existing functionality** (no breaking changes)
- **Creates clean architecture** (no duplicate structures)
- **Connects to real data** (uses monitoring.db)
- **Maintains scalability** (proper service/router separation)
- **Enables future growth** (modular design)

**Estimated Time**: 2-3 hours for careful implementation

**Recommendation**: Follow phases sequentially, test after each phase, and don't delete old code until everything is verified working.
