# Quick Integration Guide
## 🚀 Reports & Analytics Module Integration

This guide provides step-by-step instructions to safely integrate the reports_analytics module into your main project.

---

## ✅ What's Already Done

I've created the following new files for you:

### Backend Files Created:
1. **`Backend/services/__init__.py`** - Services package initializer
2. **`Backend/services/analytics_service.py`** - Analytics calculations using real database
3. **`Backend/services/reports_service.py`** - Report generation using real database
4. **`Backend/routers/reports_analytics.py`** - API endpoints for analytics

These files:
- ✅ Connect to your existing `monitoring.db` database
- ✅ Replace the missing `analytics.py` file from reports_analytics module
- ✅ Convert mock data functions to real database queries
- ✅ Follow your existing code patterns and structure

---

## 📋 Step 1: Register the Router (Backend)

**File to Edit:** `Backend/main.py`

### Add Import (around line 23, with other router imports):

```python
from routers.reports_analytics import router as reports_analytics_router
```

### Register Router (around line 443, with other router registrations):

```python
app.include_router(reports_analytics_router)
```

**Complete section should look like:**
```python
# Include routers
app.include_router(auth_router)
app.include_router(activity.router)
app.include_router(alerts.router)
app.include_router(stats.router)
app.include_router(firewall_router)
app.include_router(policy_router)
app.include_router(commands_router)
app.include_router(reports_analytics_router)  # ← NEW
```

---

## 📋 Step 2: Test Backend Integration

```powershell
# Navigate to Backend directory
cd Backend

# Activate virtual environment (if not already active)
..\.venv\Scripts\Activate.ps1

# Start the backend
uvicorn main:app --reload --port 8001
```

### Verify:
1. Open browser to: http://localhost:8001/docs
2. Check that these new endpoints appear:
   - `GET /api/analytics/summary`
   - `GET /api/analytics/charts/network`
   - `GET /api/analytics/charts/alerts`
   - `GET /api/analytics/reports/weekly`
   - `GET /api/analytics/reports/weekly/csv`

3. Test one endpoint (click "Try it out" → "Execute"):
   - Try `/api/analytics/summary`
   - Should return data from your database (not errors)

**✅ Backend integration complete if all endpoints show up and work!**

---

## 📋 Step 3: Copy Frontend Components

```powershell
# From project root directory
cd frontend

# Copy components from reports_analytics to main frontend
Copy-Item "..\reports_analytics\frontend\src\components\SummaryCards.jsx" "src\components\"
Copy-Item "..\reports_analytics\frontend\src\components\NetworkUsageChart.jsx" "src\components\"
Copy-Item "..\reports_analytics\frontend\src\components\AlertsChart.jsx" "src\components\"
Copy-Item "..\reports_analytics\frontend\src\components\WeeklyReportTable.jsx" "src\components\"

# Copy pages (with rename for clarity)
Copy-Item "..\reports_analytics\frontend\src\pages\AnalyticsDashboard.jsx" "src\pages\Analytics.jsx"
Copy-Item "..\reports_analytics\frontend\src\pages\ReportsPage.jsx" "src\pages\ReportsAnalytics.jsx"
```

---

## 📋 Step 4: Update API Service (Frontend)

**File to Edit:** `frontend/src/services/api.js`

### Add these exports at the bottom:

```javascript
// Analytics API endpoints
export const analyticsAPI = {
  getSummary: () => api.get('/api/analytics/summary'),
  getNetworkCharts: () => api.get('/api/analytics/charts/network'),
  getAlertsCharts: () => api.get('/api/analytics/charts/alerts'),
};

// Reports API endpoints
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

---

## 📋 Step 5: Update API URL in Copied Components

The components you copied still reference `http://localhost:8000`. You need to update them to use your API service.

**Files to Update:**
- `frontend/src/pages/Analytics.jsx`
- `frontend/src/pages/ReportsAnalytics.jsx`

### In `Analytics.jsx`:

**Replace these imports:**
```javascript
import { analyticsAPI, healthCheck } from '../services/api';
```

**With:**
```javascript
import { analyticsAPI } from '../services/api';
```

**Replace healthCheck calls with proper error handling** (search for `healthCheck()` and remove those checks, rely on try-catch instead).

### In `ReportsAnalytics.jsx`:

**Replace these imports:**
```javascript
import { reportsAPI, healthCheck } from '../services/api';
```

**With:**
```javascript
import { reportsAPI } from '../services/api';
```

**Remove healthCheck calls** (same as above).

---

## 📋 Step 6: Update App.jsx Routing

**File to Edit:** `frontend/src/App.jsx`

### Add imports at top:

```javascript
import Analytics from './pages/Analytics';
import ReportsAnalytics from './pages/ReportsAnalytics';
```

### Add route (inside `<Routes>`, before the closing `</Routes>` tag):

```javascript
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
```

---

## 📋 Step 7: Update Sidebar (Optional but Recommended)

**File to Edit:** `frontend/src/components/Sidebar.jsx`

### Import icon (add to existing imports at top):

```javascript
import { BarChart } from 'lucide-react';
```

### Add analytics link to menuItems array:

```javascript
const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/network-health', icon: Activity, label: 'Network Health' },
  { path: '/alerts', icon: AlertTriangle, label: 'Security Alerts' },
  { path: '/students', icon: Users, label: 'Endpoints' },
  { path: '/analytics', icon: BarChart, label: 'Analytics' },  // ← NEW
  { path: '/reports', icon: FileText, label: 'Reports' },
];
```

---

## 📋 Step 8: Update Component Styling (If Needed)

The copied components might use different CSS classes. You may need to:

1. Update component imports to use existing dashboard components where possible
2. Adjust Tailwind classes to match your theme
3. Remove standalone headers if using the shared `Navbar` component

**Quick check:** Look for hardcoded colors like `bg-blue-500` and replace with your theme colors like `bg-cyber-blue`.

---

## 📋 Step 9: Test Frontend Integration

```powershell
# Make sure backend is still running (port 8001)

# Start frontend dev server (new terminal)
cd frontend
npm run dev
```

### Verify:
1. Open browser to: http://localhost:5173
2. Login to the dashboard
3. Click on "Analytics" in sidebar (if you added it)
4. Or navigate directly to: http://localhost:5173/analytics
5. Check that data loads (summary cards, charts)

**Expected Result:** You should see analytics dashboard with real data from your database!

---

## 📋 Step 10: Final Cleanup (Optional)

Once everything works:

```powershell
# Create backup folder
mkdir archived_modules

# Move old reports_analytics folder
Move-Item "reports_analytics" "archived_modules\reports_analytics_BACKUP_$(Get-Date -Format 'yyyyMMdd')"
```

---

## 🐛 Troubleshooting

### Backend Issues:

**Error: "Cannot import 'database'"**
- Check that `services/analytics_service.py` can import from parent directory
- Try restarting the backend server

**Error: "No module named 'services'"**
- Make sure `Backend/services/__init__.py` exists
- Check you're running from Backend directory

**Endpoints return empty data:**
- Check that `monitoring.db` exists and has data
- Run: `SELECT COUNT(*) FROM activities;` in SQLite to verify
- Check backend console for error messages

### Frontend Issues:

**Error: "analyticsAPI is not defined"**
- Make sure you added the exports to `api.js`
- Check import statements in component files

**CORS errors:**
- Backend CORS is already configured in main.py
- Make sure backend is running on expected port

**Components look broken:**
- Check console for missing imports
- Verify all component files were copied successfully
- Update Tailwind classes to match your theme

**Empty/No Data showing:**
- Open browser DevTools → Network tab
- Check if API calls are successful (200 status)
- Check if response has `success: true` and `data` object
- Verify backend endpoints work in Swagger UI first

---

## ✅ Success Checklist

- [ ] Backend starts without errors
- [ ] New endpoints visible in Swagger UI (http://localhost:8001/docs)
- [ ] `/api/analytics/summary` returns data
- [ ] Frontend components copied successfully
- [ ] `api.js` updated with new exports
- [ ] `App.jsx` updated with new route
- [ ] Analytics page loads without errors
- [ ] Data displays correctly (not mock data)
- [ ] Charts render properly
- [ ] CSV download works
- [ ] No console errors in browser

---

## 🎯 What You've Achieved

After completing these steps:

✅ **Single Unified Backend** - No duplicate servers
✅ **Single Frontend Application** - No nested apps
✅ **Real Database Integration** - Using monitoring.db, not mock data
✅ **Clean Architecture** - Proper service/router separation
✅ **New Analytics Features** - Advanced reporting and visualizations
✅ **No Breaking Changes** - Existing functionality intact

---

## 📞 Next Steps

1. **Customize Styling:** Update component styles to match your dashboard theme
2. **Add Authentication:** Ensure analytics endpoints check JWT tokens (if needed)
3. **Optimize Queries:** Add indexes to database for faster analytics
4. **Add More Features:** 
   - Date range filters for reports
   - PDF export
   - Scheduled reports
   - More chart types
5. **Test Thoroughly:** Test with real student data

---

## 📝 Summary

The integration adds these new capabilities to your dashboard:

- **Analytics Summary:** Quick overview of network health metrics
- **Network Charts:** Visual representation of bandwidth usage
- **Alerts Charts:** Security alert trends and breakdowns
- **Weekly Reports:** Comprehensive reports with recommendations
- **CSV Export:** Download reports for offline analysis

All while maintaining your existing dashboard functionality!

---

**Need help?** Check the detailed `INTEGRATION_PLAN.md` for architecture details and troubleshooting.
