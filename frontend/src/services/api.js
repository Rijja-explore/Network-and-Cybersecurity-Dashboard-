
import axios from 'axios';

/**
 * Generate and download a report (PDF)
 * @returns {Promise<Blob>} - PDF blob
 */
export const generateReport = async () => {
  try {
    const response = await api.get('/reports/generate', {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to generate report';
  }
};

// Base API URL - Update this to your backend URL
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Service Functions

/**
 * Login admin user
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Promise} - API response with token
 */
export const loginAdmin = async (username, password) => {
  try {
    const response = await api.post('/auth/login', {
      username,
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || 'Invalid credentials';
  }
};

/**
 * Get all alerts
 * @returns {Promise} - Array of alerts
 */
export const getAlerts = async () => {
  try {
    const response = await api.get('/alerts');
    return response.data.alerts || [];
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

/**
 * Get active alerts only
 * @returns {Promise} - Array of active alerts
 */
export const getActiveAlerts = async () => {
  try {
    const response = await api.get('/alerts/active');
    return response.data.alerts || [];
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

/**
 * Resolve an alert
 * @param {number} alertId - Alert ID to resolve
 * @returns {Promise} - API response
 */
export const resolveAlert = async (alertId) => {
  try {
    const response = await api.post(`/alerts/${alertId}/resolve`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to resolve alert';
  }
};

/**
 * Get weekly statistics
 * @returns {Promise} - Weekly stats object
 */
export const getWeeklyStats = async () => {
  try {
    const response = await api.get('/stats/weekly');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

/**
 * Fetch student activity logs for admin dashboard
 * @returns {Promise} - Array of student activity logs
 */
export const fetchLogs = async () => {
  try {
    const response = await api.get('/admin/logs');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    // Return fallback data for testing
    return [
      {
        student_id: "STU001",
        hostname: "STUDENT-PC-001",
        cpu: 60,
        network: 2400000,
        network_mb: 2.4,
        apps: ["chrome.exe", "discord.exe", "notepad.exe"],
        timestamp: "2026-02-10 14:30",
        activity_id: 1
      }
    ];
  }
};

/**
 * Get bandwidth summary
 * @returns {Promise} - Bandwidth summary
 */
export const getBandwidthSummary = async () => {
  try {
    const response = await api.get('/stats/bandwidth-summary');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

/**
 * Block an IP address using firewall
 * @param {string} ip - IP address to block
 * @param {string} reason - Reason for blocking
 * @returns {Promise} - API response
 */
export const blockIP = async (ip, reason = 'Policy violation') => {
  try {
    const response = await api.post('/firewall/block', { ip, reason });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || 'Failed to block IP';
  }
};

/**
 * Submit student activity (for testing)
 * @param {Object} activityData - Activity data
 * @returns {Promise} - API response
 */
export const submitActivity = async (activityData) => {
  try {
    const response = await api.post('/activity', activityData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to submit activity';
  }
};

/**
 * Health check
 * @returns {Promise} - Health status
 */
export const healthCheck = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

/**
 * Get student activity data (real-time from agent reports)
 * @returns {Promise} - Array of student activity records
 */
export const getStudents = async () => {
  try {
    const response = await api.get('/admin/logs');
    const logs = response.data || [];
    // Transform to format expected by StudentsTable
    // Group by hostname to show unique students with latest data
    const studentMap = new Map();
    // For each student, also fetch currently blocked domains
    const blockedDomainsPromises = [];
    logs.forEach(log => {
      const existing = studentMap.get(log.hostname);
      if (!existing || new Date(log.raw_timestamp) > new Date(existing.raw_timestamp)) {
        studentMap.set(log.hostname, {
          hostname: log.hostname,
          ip: log.hostname,
          processes: log.apps || log.processes || [],
          websites: log.websites || [],
          destinations: log.destinations || [],
          all_websites: log.all_websites || log.websites || [],
          all_destinations: log.all_destinations || log.destinations || [],
          bandwidth: log.network || (log.bytes_sent + log.bytes_recv) || 0,
          lastSeen: log.raw_timestamp || log.timestamp,
          bytes_sent: log.bytes_sent,
          bytes_recv: log.bytes_recv,
          activity_id: log.activity_id,
          blocked_domains: [] // will be filled below
        });
        // Prepare to fetch blocked domains for this student
        blockedDomainsPromises.push(
          api.get(`/commands/blocked-domains?student_id=${log.hostname}`)
            .then(res => ({ hostname: log.hostname, blocked_domains: res.data.blocked_domains || [] }))
            .catch(() => ({ hostname: log.hostname, blocked_domains: [] }))
        );
      }
    });
    // Wait for all blocked domains fetches
    const blockedResults = await Promise.all(blockedDomainsPromises);
    blockedResults.forEach(({ hostname, blocked_domains }) => {
      const student = studentMap.get(hostname);
      if (student) student.blocked_domains = blocked_domains;
    });
    return Array.from(studentMap.values());
  } catch (error) {
    console.error('API Error fetching students:', error);
    return [];
  }
};

/**
 * Block a domain using firewall
 * @param {string} domain - Domain to block
 * @param {string} reason - Reason for blocking
 * @returns {Promise} - API response
 */
export const blockDomain = async (domain, reason = 'Unauthorized access') => {
  try {
    const response = await api.post('/firewall/block-domain', { 
      ip: domain, // API uses 'ip' field for both IP and domain
      reason 
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || 'Failed to block domain';
  }
};

/**
 * Block a domain on a specific student's machine remotely
 * @param {string} studentId - Student hostname
 * @param {string} domain - Domain to block
 * @param {string} reason - Reason for blocking
 * @returns {Promise} - API response
 */
export const blockDomainOnStudent = async (studentId, domain, reason = 'Admin policy violation') => {
  try {
    const response = await api.post('/admin/block-domain', {
      student_id: studentId,
      domain: domain,
      reason: reason
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || 'Failed to block domain on student machine';
  }
};

/**
 * Unblock a domain on a specific student's machine remotely
 * @param {string} studentId - Student hostname
 * @param {string} domain - Domain to unblock
 * @param {string} reason - Reason for unblocking
 * @returns {Promise} - API response
 */
export const unblockDomainOnStudent = async (studentId, domain, reason = 'Admin unblock request') => {
  try {
    const response = await api.post('/admin/unblock-domain', {
      student_id: studentId,
      domain: domain,
      reason: reason
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || 'Failed to unblock domain on student machine';
  }
};

/**
 * Unblock an IP or domain
 * @param {string} target - IP address or domain to unblock
 * @returns {Promise} - API response
 */
export const unblockResource = async (target) => {
  try {
    const response = await api.post('/firewall/unblock', { 
      ip: target,
      reason: 'Unblock request'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || 'Failed to unblock resource';
  }
};

/**
 * Get list of firewall blocking rules
 * @returns {Promise} - List of active blocking rules
 */
export const getFirewallRules = async () => {
  try {
    const response = await api.get('/firewall/rules');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    return { rules: [], count: 0 };
  }
};

/**
 * Get domain policies (allowed and blocked)
 * @returns {Promise} - Domain policy configuration
 */
export const getDomainPolicies = async () => {
  try {
    const response = await api.get('/policy/domains');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    return { allowed_domains: [], blocked_domains: [], blocked_keywords: [] };
  }
};

/**
 * Add domain to block list
 * @param {string} domain - Domain to block
 * @param {string} reason - Reason for blocking
 * @returns {Promise} - API response
 */
export const addBlockedDomain = async (domain, reason = 'Policy violation') => {
  try {
    const response = await api.post('/policy/domains/block', {
      domain,
      policy: 'blocked',
      reason
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || 'Failed to add blocked domain';
  }
};

/**
 * Add domain to allow list
 * @param {string} domain - Domain to allow
 * @returns {Promise} - API response
 */
export const addAllowedDomain = async (domain) => {
  try {
    const response = await api.post('/policy/domains/allow', {
      domain,
      policy: 'allowed',
      reason: 'Whitelisted'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || 'Failed to add allowed domain';
  }
};

/**
 * Remove domain from policies
 * @param {string} domain - Domain to remove
 * @returns {Promise} - API response
 */
export const removeDomainPolicy = async (domain) => {
  try {
    const response = await api.delete(`/policy/domains/${domain}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || 'Failed to remove domain policy';
  }
};

/**
 * Get policy summary
 * @returns {Promise} - Policy summary statistics
 */
export const getPolicySummary = async () => {
  try {
    const response = await api.get('/policy/summary');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

// Legacy compatibility functions
export const getNetworkHealth = getWeeklyStats;
export const blockStudent = blockIP;
export const getDashboardStats = getWeeklyStats;

export default api;
