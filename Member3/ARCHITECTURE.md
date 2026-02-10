# Backend Architecture Overview

## 📁 Complete Project Structure

```
backend/
│
├── main.py                    # FastAPI application entry point
├── config.py                  # Configuration management & settings
├── database.py                # SQLite database operations
├── models.py                  # Pydantic request/response models
├── alerts.py                  # Policy violation detection engine
├── stats.py                   # Statistics calculation engine
│
├── routers/                   # API route handlers
│   ├── __init__.py
│   ├── activity.py           # POST /activity - Data ingestion
│   ├── alerts.py             # Alert management endpoints
│   └── stats.py              # Statistics & analytics endpoints
│
├── utils/                     # Utility modules
│   ├── __init__.py
│   └── time.py               # Time/date helper functions
│
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── .env                      # Actual environment config (gitignored)
├── .gitignore                # Git ignore rules
├── README.md                 # Complete documentation
├── ARCHITECTURE.md           # This file
├── setup.ps1                 # Windows setup automation script
├── test_api.py               # API testing suite
│
└── monitoring.db             # SQLite database (auto-created, gitignored)
```

---

## 🏗️ Architecture Layers

### 1. **Presentation Layer** (Routers)
- **Location**: `routers/`
- **Purpose**: Handle HTTP requests/responses
- **Components**:
  - `activity.py` - Activity data ingestion
  - `alerts.py` - Alert management
  - `stats.py` - Statistics delivery

### 2. **Business Logic Layer**
- **Location**: Root directory
- **Purpose**: Core application logic
- **Components**:
  - `alerts.py` - Violation detection algorithms
  - `stats.py` - Analytics calculations

### 3. **Data Access Layer**
- **Location**: `database.py`
- **Purpose**: Database abstraction
- **Features**:
  - Connection management
  - CRUD operations
  - Query optimization

### 4. **Data Models Layer**
- **Location**: `models.py`
- **Purpose**: Data validation & serialization
- **Type**: Pydantic models for type safety

### 5. **Configuration Layer**
- **Location**: `config.py`
- **Purpose**: Centralized settings management
- **Features**: Environment-based configuration

---

## 🔄 Request Flow

```
1. Client Request
   ↓
2. FastAPI Router (routers/*.py)
   ↓
3. Request Validation (models.py)
   ↓
4. Business Logic (alerts.py / stats.py)
   ↓
5. Database Operations (database.py)
   ↓
6. Response Serialization (models.py)
   ↓
7. Client Response
```

### Example: Activity Submission Flow

```python
# 1. Client sends POST request to /activity
{
    "hostname": "STUDENT01",
    "bytes_sent": 123456,
    "bytes_recv": 654321,
    "processes": ["chrome.exe", "utorrent.exe"]
}

# 2. Router receives request (routers/activity.py)
# 3. Pydantic validates input (models.ActivityRequest)
# 4. Database stores activity (database.insert_activity)
# 5. Violation check (alerts.detector.check_violations)
# 6. Alert created if needed (database.insert_alert)
# 7. Response sent (models.ActivityResponse)
```

---

## 🗄️ Database Schema

### Activities Table
```sql
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostname TEXT NOT NULL,
    bytes_sent INTEGER NOT NULL,
    bytes_recv INTEGER NOT NULL,
    process_list TEXT NOT NULL,        -- JSON array
    timestamp TEXT NOT NULL,           -- ISO 8601
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_activities_hostname ON activities(hostname);
CREATE INDEX idx_activities_timestamp ON activities(timestamp);
```

### Alerts Table
```sql
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostname TEXT NOT NULL,
    reason TEXT NOT NULL,
    severity TEXT NOT NULL,            -- low/medium/high/critical
    activity_id INTEGER,
    status TEXT NOT NULL DEFAULT 'active',  -- active/resolved
    timestamp TEXT NOT NULL,
    resolved_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (activity_id) REFERENCES activities(id)
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp);
```

---

## 🔐 Security Architecture

### 1. **Input Validation**
- Pydantic models validate all inputs
- Type checking at runtime
- Field constraints (min/max length, ranges)

### 2. **SQL Injection Prevention**
- Parameterized queries throughout
- No string concatenation in SQL
- SQLite built-in protections

### 3. **CORS Protection**
- Configurable allowed origins
- Credential support optional
- Pre-flight request handling

### 4. **Error Handling**
- Global exception handler
- Consistent error responses
- Debug mode for development

### 5. **JWT-Ready Structure**
- Configuration in place
- Easy to add authentication
- Token-based auth framework

---

## 📊 Policy Engine Design

### Violation Detection Logic

```python
class PolicyViolationDetector:
    def check_violations(processes, bytes_sent, bytes_recv, hostname):
        # Check 1: Blocked Process Detection
        for process in processes:
            if any(keyword in process for keyword in BLOCKED_KEYWORDS):
                return ViolationResult(
                    violation=True,
                    severity="high",
                    reason="Blocked application detected"
                )
        
        # Check 2: Bandwidth Threshold
        total_bandwidth = bytes_sent + bytes_recv
        if total_bandwidth > THRESHOLD:
            return ViolationResult(
                violation=True,
                severity="medium",
                reason="Bandwidth threshold exceeded"
            )
        
        # No violations
        return ViolationResult(violation=False)
```

### Configurable Policies

**Blocked Keywords** (`.env`):
```
BLOCKED_KEYWORDS=torrent,proxy,nmap,wireshark,metasploit
```

**Bandwidth Threshold** (`.env`):
```
BANDWIDTH_THRESHOLD_MB=500
```

---

## 📈 Statistics Engine Design

### Calculation Strategy

1. **Time-based Queries**
   - All stats cover last 7 days
   - Uses SQLite datetime functions
   - Efficient indexing on timestamps

2. **Aggregation Functions**
   - SUM for bandwidth totals
   - COUNT DISTINCT for active users
   - GROUP BY for top consumers

3. **Response Optimization**
   - Pre-calculated percentages
   - Multiple unit conversions (bytes, MB, GB)
   - Chart-ready data structures

### Key Metrics

- **Bandwidth Usage**: Total sent/received in bytes, MB, GB
- **Active Students**: Unique hostnames in period
- **Alert Statistics**: Count by severity, percentages
- **Top Consumers**: Ranked by total bandwidth

---

## 🔌 API Design Principles

### 1. **RESTful Conventions**
- Proper HTTP methods (GET, POST, PATCH)
- Resource-based URLs
- Appropriate status codes

### 2. **Consistent Response Format**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### 3. **Pagination-Ready**
Structure supports future pagination:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "per_page": 20
}
```

### 4. **Versioning Strategy**
- Currently v1 (implicit)
- Can add `/v2/` prefix for breaking changes
- Maintains backward compatibility

---

## 🚀 Performance Considerations

### 1. **Database Optimization**
- Indexes on frequently queried columns
- Context managers for proper connection handling
- Prepared statements (parameterized queries)

### 2. **Async Operations**
- FastAPI async/await support
- Non-blocking database operations
- Concurrent request handling

### 3. **Caching Strategy** (Future)
- Redis for statistics caching
- TTL-based invalidation
- Reduced database load

### 4. **Query Optimization**
- Single queries for complex data
- Avoid N+1 problems
- Efficient JOINs

---

## 🧪 Testing Strategy

### Test Coverage Areas

1. **Unit Tests** (Future)
   - Test individual functions
   - Mock database operations
   - Validate business logic

2. **Integration Tests** (`test_api.py`)
   - End-to-end API testing
   - Database interactions
   - Real HTTP requests

3. **Load Testing** (Future)
   - Concurrent request handling
   - Performance benchmarks
   - Stress testing

---

## 📦 Deployment Architecture

### Development
```
[Python Agent] → [FastAPI Server] → [SQLite DB]
                      ↓
               [React Dashboard]
```

### Production (Recommended)
```
[Python Agents] → [Load Balancer] → [FastAPI Servers]
                                          ↓
                                   [PostgreSQL]
                                          ↓
                                   [Redis Cache]
                                          ↓
                                [React Dashboard (Nginx)]
```

---

## 🔄 Extensibility Points

### Easy to Add:

1. **New Policies**
   - Add to `alerts.py`
   - Update `BLOCKED_KEYWORDS`
   - No database changes needed

2. **New Statistics**
   - Add methods to `stats.py`
   - Create new router endpoints
   - Reuse existing database queries

3. **Authentication**
   - JWT structure already in place
   - Add login/register endpoints
   - Protect routes with dependencies

4. **New Data Sources**
   - Abstract database layer
   - Easy to swap SQLite → PostgreSQL
   - Add repository pattern

5. **Real-time Features**
   - WebSocket support via FastAPI
   - Push notifications
   - Live dashboard updates

---

## 🎯 Design Patterns Used

### 1. **Repository Pattern**
- `database.py` acts as repository
- Abstracts data access
- Easy to test and replace

### 2. **Dependency Injection**
- FastAPI's built-in DI system
- Shared instances (db, detector, stats_engine)
- Easy to mock for testing

### 3. **Single Responsibility**
- Each module has one purpose
- Clear separation of concerns
- Maintainable codebase

### 4. **Configuration Pattern**
- Centralized settings
- Environment-based config
- No hardcoded values

### 5. **Factory Pattern** (Implicit)
- Global instances created once
- Shared across application
- Efficient resource usage

---

## 📚 Code Quality Standards

### Type Hints
```python
def insert_activity(
    hostname: str,
    bytes_sent: int,
    bytes_recv: int,
    processes: List[str]
) -> int:
    ...
```

### Docstrings
```python
def check_violations(self, processes, bytes_sent, bytes_recv, hostname):
    """
    Check if activity violates any policies.
    
    Args:
        processes: List of running process names
        bytes_sent: Total bytes sent by machine
        bytes_recv: Total bytes received by machine
        hostname: Machine hostname
    
    Returns:
        ViolationResult with violation status and details
    """
```

### Error Handling
```python
try:
    # Operation
    result = perform_operation()
    return result
except Exception as e:
    logger.error(f"Operation failed: {str(e)}")
    raise HTTPException(status_code=500, detail=str(e))
```

---

## 🔮 Future Enhancements

1. **Authentication & Authorization**
   - User roles (admin, viewer)
   - JWT token management
   - Password reset flow

2. **Real-time Monitoring**
   - WebSocket connections
   - Live activity feed
   - Push notifications

3. **Advanced Analytics**
   - Trend analysis
   - Machine learning for anomaly detection
   - Predictive alerts

4. **Scalability**
   - Microservices architecture
   - Message queues (RabbitMQ/Kafka)
   - Distributed caching

5. **Reporting**
   - PDF report generation
   - Email alerts
   - Scheduled reports

---

## 📖 Further Reading

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Pydantic Docs**: https://docs.pydantic.dev
- **SQLite Docs**: https://www.sqlite.org/docs.html
- **REST API Best Practices**: https://restfulapi.net

---

**This architecture is designed to be:**
- ✅ Scalable
- ✅ Maintainable
- ✅ Testable
- ✅ Secure
- ✅ Production-ready
- ✅ Well-documented
