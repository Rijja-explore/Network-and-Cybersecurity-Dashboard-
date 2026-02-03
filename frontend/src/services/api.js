import axios from 'axios';

// Base API URL - Update this to your backend URL
const API_BASE_URL = 'http://localhost:8000/api';

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
    const response = await api.post('/login', { username, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed';
  }
};

/**
 * Get all students/endpoints
 * @returns {Promise} - Array of students
 */
export const getStudents = async () => {
  try {
    const response = await api.get('/students');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch students';
  }
};

/**
 * Get cybersecurity alerts
 * @returns {Promise} - Array of alerts
 */
export const getAlerts = async () => {
  try {
    const response = await api.get('/alerts');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch alerts';
  }
};

/**
 * Get network health data
 * @returns {Promise} - Network health metrics
 */
export const getNetworkHealth = async () => {
  try {
    const response = await api.get('/network-health');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch network health';
  }
};

/**
 * Block a student by IP address
 * @param {string} ip - Student IP address to block
 * @returns {Promise} - API response
 */
export const blockStudent = async (ip) => {
  try {
    const response = await api.post(`/block/${ip}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to block student';
  }
};

/**
 * Get dashboard summary/KPIs
 * @returns {Promise} - Dashboard metrics
 */
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch dashboard stats';
  }
};

/**
 * Generate weekly report
 * @returns {Promise} - Report data or download link
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

export default api;
