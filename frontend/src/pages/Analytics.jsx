/**
 * Analytics Dashboard Page
 * ========================
 * Main analytics dashboard displaying summary cards and charts
 * Integrated with the main cybersecurity dashboard backend
 */

import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import Navbar from '../components/Navbar';
import SummaryCards from '../components/SummaryCards';
import NetworkUsageChart from '../components/NetworkUsageChart';
import AlertsChart from '../components/AlertsChart';

const Analytics = () => {
  // State management
  const [summaryData, setSummaryData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [summaryResponse, networkResponse, alertsResponse] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getNetworkCharts(),
        analyticsAPI.getAlertsCharts(),
      ]);

      // Update state with fetched data
      setSummaryData(summaryResponse.data?.data);
      setNetworkData(networkResponse.data?.data);
      setAlertsData(alertsResponse.data?.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Auto-refresh every 5 minutes
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
    <div className="flex-1 ml-64">
      <Navbar title="Analytics Dashboard" />

      <div className="p-8">
        {/* Header Section */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-soc-text mb-2">Network Analytics</h2>
            <p className="text-sm text-gray-400">
              Comprehensive analytics and insights from monitoring data
            </p>
            {lastUpdated && !loading && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              loading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-neon-blue text-white hover:bg-neon-cyan shadow-md hover:shadow-neon-blue'
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
              'Refresh Data'
            )}
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-400">Error Loading Analytics Data</h3>
                <p className="text-sm text-red-300 mt-1">{error}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Make sure the backend is running and analytics endpoints are available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <SummaryCards summaryData={summaryData} loading={loading} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Network Usage Chart */}
          <NetworkUsageChart chartData={networkData} loading={loading} />

          {/* Alerts Chart */}
          <AlertsChart chartData={alertsData} loading={loading} />
        </div>

        {/* Quick Actions Section */}
        <div className="mt-8 p-6 bg-cyber-card border border-cyber-border rounded-xl">
          <h3 className="text-lg font-semibold text-soc-text mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="/reports"
              className="flex items-center p-4 bg-cyber-darker/50 rounded-lg hover:bg-cyber-border transition-all hover:shadow-md"
            >
              <svg className="w-8 h-8 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-soc-text">View Reports</p>
                <p className="text-xs text-gray-400">Access detailed reports</p>
              </div>
            </a>

            <button
              onClick={handleRefresh}
              className="flex items-center p-4 bg-cyber-darker/50 rounded-lg hover:bg-cyber-border transition-all hover:shadow-md"
            >
              <svg className="w-8 h-8 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-soc-text">Refresh Analytics</p>
                <p className="text-xs text-gray-400">Update all metrics</p>
              </div>
            </button>

            <a
              href="/dashboard"
              className="flex items-center p-4 bg-cyber-darker/50 rounded-lg hover:bg-cyber-border transition-all hover:shadow-md"
            >
              <svg className="w-8 h-8 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="ml-4">
                <p className="text-sm font-medium text-soc-text">Main Dashboard</p>
                <p className="text-xs text-gray-400">Return to overview</p>
              </div>
            </a>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-cyber-card/50 border border-cyber-border rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            Analytics data is automatically refreshed every 5 minutes. Click "Refresh Data" for manual updates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
