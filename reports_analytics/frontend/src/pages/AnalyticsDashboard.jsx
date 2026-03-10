/**
 * Analytics Dashboard Page
 * ========================
 * Main analytics dashboard displaying summary cards and charts
 * 
 * INTEGRATION NOTES:
 * - Currently fetches from local analytics microservice
 * - To connect to main backend, update API endpoints in services/api.js
 * - Add real-time updates with WebSocket when available
 */

import React, { useState, useEffect } from 'react';
import { analyticsAPI, healthCheck } from '../services/api';
import {
  SummaryCards,
  NetworkUsageChart,
  AlertsChart,
} from '../components';

const AnalyticsDashboard = () => {
  // State management
  const [summaryData, setSummaryData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check API health first
      const isHealthy = await healthCheck();
      setApiStatus(isHealthy ? 'online' : 'offline');

      if (!isHealthy) {
        throw new Error('Analytics API is not available. Please start the backend server.');
      }

      // Fetch all data in parallel
      const [summaryResponse, networkResponse, alertsResponse] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getNetworkCharts(),
        analyticsAPI.getAlertsCharts(),
      ]);

      // Update state with fetched data
      setSummaryData(summaryResponse.data);
      setNetworkData(networkResponse.data);
      setAlertsData(alertsResponse.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
      setApiStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Auto-refresh (optional - every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchAnalyticsData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading]);

  // Refresh button handler
  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Network Health & Cybersecurity Monitoring
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              {/* API Status indicator */}
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    apiStatus === 'online' ? 'bg-green-500' :
                    apiStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
                    'bg-red-500'
                  }`}
                ></span>
                <span className="text-sm text-gray-600">
                  API {apiStatus === 'checking' ? 'Connecting...' : apiStatus}
                </span>
              </div>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Loading...</span>
                  </span>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Make sure the backend is running: <code className="bg-red-100 px-1 rounded">uvicorn main:app --reload --port 8000</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last updated timestamp */}
        {lastUpdated && !loading && (
          <p className="text-sm text-gray-500 mb-4">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        {/* Summary Cards */}
        <SummaryCards summaryData={summaryData} loading={loading} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Network Usage Chart */}
          <NetworkUsageChart chartData={networkData} loading={loading} />

          {/* Alerts Chart */}
          <AlertsChart chartData={alertsData} loading={loading} />
        </div>

        {/* Quick Actions / Navigation */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="/reports"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-800">View Reports</p>
                <p className="text-xs text-gray-500">Access detailed reports</p>
              </div>
            </a>

            <button
              onClick={handleRefresh}
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-800">Refresh Data</p>
                <p className="text-xs text-gray-500">Update all analytics</p>
              </div>
            </button>

            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-800">Settings</p>
                <p className="text-xs text-gray-500">Configure dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-500 text-center">
            Network Health & Cybersecurity Monitoring Dashboard - Reports & Analytics Module
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AnalyticsDashboard;
