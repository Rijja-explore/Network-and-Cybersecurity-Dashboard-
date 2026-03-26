/**
 * API Service Layer
 * =================
 * Centralized API communication for the Analytics Dashboard
 * 
 * INTEGRATION NOTES:
 * - Currently connects to local analytics microservice (port 8000)
 * - To connect to main backend, update BASE_URL
 * - All API calls include error handling and loading states
 */

import axios from 'axios';

// Base URL for API calls
// INTEGRATION NOTE: Change this when connecting to main backend
const BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (development)
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('[API] Response error:', error.response?.data || error.message);
    
    // Create user-friendly error message
    const errorMessage = error.response?.data?.detail 
      || error.response?.data?.error 
      || error.message 
      || 'An unexpected error occurred';
    
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * Analytics API endpoints
 */
export const analyticsAPI = {
  /**
   * Fetch summary analytics for dashboard cards
   * @returns {Promise} Summary data including alerts, users, bandwidth
   */
  getSummary: async () => {
    const response = await api.get('/analytics/summary');
    return response.data;
  },

  /**
   * Fetch network usage data for charts
   * @returns {Promise} Time series, per-student, and hourly data
   */
  getNetworkCharts: async () => {
    const response = await api.get('/analytics/charts/network');
    return response.data;
  },

  /**
   * Fetch alerts data for charts
   * @returns {Promise} Alerts by type, severity, and daily trend
   */
  getAlertsCharts: async () => {
    const response = await api.get('/analytics/charts/alerts');
    return response.data;
  },
};

/**
 * Reports API endpoints
 */
export const reportsAPI = {
  /**
   * Fetch weekly report data
   * @returns {Promise} Comprehensive weekly report
   */
  getWeeklyReport: async () => {
    const response = await api.get('/reports/weekly');
    return response.data;
  },

  /**
   * Download weekly report as CSV
   * INTEGRATION NOTE: Add PDF download when backend supports it
   */
  downloadWeeklyCSV: async () => {
    const response = await api.get('/reports/weekly/csv', {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `weekly_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download weekly report as PDF (placeholder)
   * INTEGRATION NOTE: Implement when backend PDF export is ready
   */
  downloadWeeklyPDF: async () => {
    // TODO: Implement when backend supports PDF export
    console.warn('PDF export not yet implemented');
    throw new Error('PDF export coming soon');
  },
};

/**
 * Health check endpoint
 */
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'healthy';
  } catch {
    return false;
  }
};

export default api;
