# Test Cases Documentation
## Network Health & Cybersecurity Monitoring Dashboard
### Reports & Analytics Module

---

## 1. Functional Tests

### 1.1 Backend API Tests

#### TC-API-001: Health Check Endpoint
| Field | Value |
|-------|-------|
| **Test ID** | TC-API-001 |
| **Description** | Verify API health check returns correct status |
| **Endpoint** | GET / |
| **Expected Result** | Status 200, JSON with service info |
| **Test Steps** | 1. Start backend server<br>2. Send GET request to /<br>3. Verify response |

```bash
# Test Command
curl http://localhost:8000/
# Expected: {"status":"online","service":"Analytics & Reports API"...}

curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"analytics"}
```

---

#### TC-API-002: Analytics Summary Endpoint
| Field | Value |
|-------|-------|
| **Test ID** | TC-API-002 |
| **Description** | Verify /analytics/summary returns correct data structure |
| **Endpoint** | GET /analytics/summary |
| **Expected Result** | JSON with total_alerts, active_users, bandwidth |

```bash
curl http://localhost:8000/analytics/summary
```

**Expected Response Structure:**
```json
{
  "success": true,
  "data": {
    "total_alerts": 12,
    "alerts_by_severity": {"critical": 3, "warning": 5, "info": 4},
    "active_users": 7,
    "total_bandwidth_mb": 5072.2,
    "avg_bandwidth_mb": 338.15,
    "top_applications": [...],
    "generated_at": "2026-02-11T..."
  }
}
```

---

#### TC-API-003: Network Charts Endpoint
| Field | Value |
|-------|-------|
| **Test ID** | TC-API-003 |
| **Description** | Verify /analytics/charts/network returns chart-ready data |
| **Endpoint** | GET /analytics/charts/network |
| **Expected Result** | JSON with time_series, per_student, hourly_pattern |

**Validation Criteria:**
- [ ] time_series is array with timestamp, bandwidth, student_id
- [ ] per_student is array with student_id, total_bandwidth
- [ ] hourly_pattern is array with hour, bandwidth

---

#### TC-API-004: Alerts Charts Endpoint
| Field | Value |
|-------|-------|
| **Test ID** | TC-API-004 |
| **Description** | Verify /analytics/charts/alerts returns alert data |
| **Endpoint** | GET /analytics/charts/alerts |
| **Expected Result** | JSON with by_type, by_severity, daily_trend, recent_alerts |

---

#### TC-API-005: Weekly Report Endpoint
| Field | Value |
|-------|-------|
| **Test ID** | TC-API-005 |
| **Description** | Verify /reports/weekly returns comprehensive report |
| **Endpoint** | GET /reports/weekly |
| **Expected Result** | JSON with all report sections |

**Required Sections:**
- [ ] report_period (start_date, end_date, generated_at)
- [ ] executive_summary (health_status, key_metrics, highlights)
- [ ] network_usage (daily_breakdown, top_consumers, peak_usage)
- [ ] security_alerts (by_type, by_severity, critical_alerts)
- [ ] student_activity (student_summary, risk levels)
- [ ] recommendations (prioritized action items)

---

#### TC-API-006: CSV Export Endpoint
| Field | Value |
|-------|-------|
| **Test ID** | TC-API-006 |
| **Description** | Verify /reports/weekly/csv returns downloadable CSV |
| **Endpoint** | GET /reports/weekly/csv |
| **Expected Result** | CSV file with Content-Disposition header |

```bash
curl -I http://localhost:8000/reports/weekly/csv
# Expected Header: Content-Disposition: attachment; filename=weekly_report_...csv
```

---

### 1.2 Frontend Component Tests

#### TC-FE-001: Summary Cards Display
| Field | Value |
|-------|-------|
| **Test ID** | TC-FE-001 |
| **Description** | Verify SummaryCards renders correctly |
| **Component** | SummaryCards.jsx |
| **Test Steps** | 1. Load dashboard<br>2. Verify 4 cards displayed<br>3. Check values match API |

**Validation:**
- [ ] Total Alerts card shows correct count
- [ ] Active Users card shows unique student count
- [ ] Bandwidth card shows total in GB
- [ ] Top Application card shows most used app

---

#### TC-FE-002: Network Chart Interactions
| Field | Value |
|-------|-------|
| **Test ID** | TC-FE-002 |
| **Description** | Verify NetworkUsageChart tab switching |
| **Component** | NetworkUsageChart.jsx |

**Test Steps:**
1. Click "Timeline" tab → Line chart displays
2. Click "By Student" tab → Bar chart displays
3. Click "Hourly Pattern" tab → Area chart displays
4. Hover on data points → Tooltips appear

---

#### TC-FE-003: Alerts Chart Interactions
| Field | Value |
|-------|-------|
| **Test ID** | TC-FE-003 |
| **Description** | Verify AlertsChart view switching |
| **Component** | AlertsChart.jsx |

**Test Steps:**
1. Click "By Severity" → Pie chart with colors
2. Click "By Type" → Horizontal bar chart
3. Click "Daily Trend" → Line chart
4. Verify recent alerts list shows last 3 alerts

---

#### TC-FE-004: Weekly Report Table Navigation
| Field | Value |
|-------|-------|
| **Test ID** | TC-FE-004 |
| **Description** | Verify WeeklyReportTable section tabs |
| **Component** | WeeklyReportTable.jsx |

**Test Steps:**
1. Click "Summary" → Health status badge, key metrics
2. Click "Network" → Bandwidth stats, top consumers table
3. Click "Alerts" → Severity breakdown, critical alerts list
4. Click "Students" → Student table with risk levels
5. Click "Actions" → Prioritized recommendations

---

#### TC-FE-005: CSV Download Functionality
| Field | Value |
|-------|-------|
| **Test ID** | TC-FE-005 |
| **Description** | Verify CSV download triggers file download |
| **Page** | ReportsPage.jsx |

**Test Steps:**
1. Navigate to /reports
2. Click "Download CSV"
3. Verify file downloads with .csv extension
4. Open file and verify data matches report

---

### 1.3 Integration Tests

#### TC-INT-001: Frontend-Backend Connection
| Field | Value |
|-------|-------|
| **Test ID** | TC-INT-001 |
| **Description** | Verify frontend successfully calls all backend endpoints |

**Test Steps:**
1. Start backend on port 8000
2. Start frontend on port 3000
3. Open browser console
4. Verify no CORS errors
5. Verify all API calls return 200

---

#### TC-INT-002: Error Handling - Backend Offline
| Field | Value |
|-------|-------|
| **Test ID** | TC-INT-002 |
| **Description** | Verify frontend handles backend unavailable |

**Expected Behavior:**
- [ ] API status shows "offline"
- [ ] Error message displayed
- [ ] Instructions shown (how to start backend)
- [ ] No app crash

---

#### TC-INT-003: Data Refresh
| Field | Value |
|-------|-------|
| **Test ID** | TC-INT-003 |
| **Description** | Verify data refresh functionality |

**Test Steps:**
1. Load dashboard
2. Note current values
3. Click "Refresh" button
4. Verify loading state appears
5. Verify data reloads successfully
6. Verify "Last updated" timestamp changes

---

## 2. Edge Cases

### EC-001: Empty Mock Data
| Scenario | Expected Behavior |
|----------|-------------------|
| mock_activity.json is empty [] | Summary shows 0 values, charts show "No data" message |
| mock_alerts.json is empty [] | Alerts section shows "No alerts detected" |

### EC-002: Large Dataset
| Scenario | Expected Behavior |
|----------|-------------------|
| 1000+ activity records | Charts render without lag, scrollable tables |
| 500+ alert records | Pagination or "Show more" (future feature) |

### EC-003: Missing Fields in Data
| Scenario | Expected Behavior |
|----------|-------------------|
| Activity missing bandwidth_used | Default to 0, no crash |
| Alert missing severity | Default color (gray) |

### EC-004: Malformed JSON
| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid JSON in mock files | Backend returns 500 with error message |
| Frontend displays error alert | User sees "Error loading data" |

---

## 3. API Response Validation

### Schema: /analytics/summary
```json
{
  "success": "boolean",
  "data": {
    "total_alerts": "integer",
    "alerts_by_severity": {
      "critical": "integer",
      "warning": "integer",
      "info": "integer"
    },
    "active_users": "integer",
    "total_bandwidth_mb": "float",
    "avg_bandwidth_mb": "float",
    "top_applications": [
      {"name": "string", "count": "integer"}
    ],
    "generated_at": "ISO datetime string"
  }
}
```

### Schema: /analytics/charts/network
```json
{
  "success": "boolean",
  "data": {
    "time_series": [
      {"timestamp": "ISO datetime", "bandwidth": "float", "student_id": "string"}
    ],
    "per_student": [
      {"student_id": "string", "total_bandwidth": "float"}
    ],
    "hourly_pattern": [
      {"hour": "string (HH:00)", "bandwidth": "float"}
    ],
    "chart_config": {
      "x_axis_label": "string",
      "y_axis_label": "string",
      "chart_title": "string"
    }
  }
}
```

### Schema: /reports/weekly
```json
{
  "success": "boolean",
  "data": {
    "report_period": {
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "generated_at": "ISO datetime",
      "report_type": "weekly"
    },
    "executive_summary": {
      "health_status": "healthy|warning|critical",
      "health_message": "string",
      "key_metrics": "object",
      "highlights": ["string"]
    },
    "network_usage": "object",
    "security_alerts": "object",
    "student_activity": "object",
    "recommendations": "array"
  }
}
```

---

## 4. Performance Tests

### PT-001: Page Load Time
| Metric | Target |
|--------|--------|
| Dashboard initial load | < 3 seconds |
| Charts rendering | < 1 second |
| Report generation | < 2 seconds |

### PT-002: API Response Time
| Endpoint | Target |
|----------|--------|
| /analytics/summary | < 200ms |
| /analytics/charts/* | < 300ms |
| /reports/weekly | < 500ms |

---

## 5. Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 100+ | Primary Support |
| Firefox | 100+ | Supported |
| Safari | 15+ | Supported |
| Edge | 100+ | Supported |

---

## 6. Test Execution Commands

### Backend Tests
```bash
# Start backend
cd reports_analytics/backend
uvicorn main:app --reload --port 8000

# Run manual API tests
curl http://localhost:8000/analytics/summary
curl http://localhost:8000/analytics/charts/network
curl http://localhost:8000/analytics/charts/alerts
curl http://localhost:8000/reports/weekly
curl http://localhost:8000/reports/weekly/csv --output test.csv
```

### Frontend Tests (Manual)
```bash
# Start frontend
cd reports_analytics/frontend
npm install
npm run dev

# Open http://localhost:3000
# Follow test cases above
```

---

## 7. Test Results Template

| Test ID | Status | Notes | Date |
|---------|--------|-------|------|
| TC-API-001 | ☐ Pass / ☐ Fail | | |
| TC-API-002 | ☐ Pass / ☐ Fail | | |
| TC-API-003 | ☐ Pass / ☐ Fail | | |
| TC-API-004 | ☐ Pass / ☐ Fail | | |
| TC-API-005 | ☐ Pass / ☐ Fail | | |
| TC-API-006 | ☐ Pass / ☐ Fail | | |
| TC-FE-001 | ☐ Pass / ☐ Fail | | |
| TC-FE-002 | ☐ Pass / ☐ Fail | | |
| TC-FE-003 | ☐ Pass / ☐ Fail | | |
| TC-FE-004 | ☐ Pass / ☐ Fail | | |
| TC-FE-005 | ☐ Pass / ☐ Fail | | |
| TC-INT-001 | ☐ Pass / ☐ Fail | | |
| TC-INT-002 | ☐ Pass / ☐ Fail | | |
| TC-INT-003 | ☐ Pass / ☐ Fail | | |

---

*Document Version: 1.0*
*Last Updated: February 2026*
*Module: Reports & Analytics (Member 5)*
