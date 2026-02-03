import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AlertsTable from '../components/AlertsTable';
import RefreshTimer from '../components/RefreshTimer';
import Loader from '../components/Loader';
import { getAlerts } from '../services/api';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [severityFilter, setSeverityFilter] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAlerts();
      setAlerts(data);
      setFilteredAlerts(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter alerts by severity
  useEffect(() => {
    if (severityFilter === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter((alert) => alert.severity?.toLowerCase() === severityFilter));
    }
  }, [severityFilter, alerts]);

  const handleManualRefresh = () => {
    setCountdown(5);
    fetchData();
  };

  const alertStats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity?.toLowerCase() === 'critical').length,
    warning: alerts.filter((a) => a.severity?.toLowerCase() === 'warning').length,
    info: alerts.filter((a) => a.severity?.toLowerCase() === 'info').length,
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex-1 ml-64">
        <Navbar title="Security Alerts" />
        <div className="p-8 h-96">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-64">
      <Navbar title="Security Alerts" />

      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-soc-text">Active Security Alerts</h3>
            <p className="text-sm text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <RefreshTimer seconds={countdown} onRefresh={handleManualRefresh} />
        </div>

        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Total Alerts</p>
            <p className="text-3xl font-bold text-soc-text">{alertStats.total}</p>
          </div>
          <div className="bg-soc-card border border-red-500/30 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Critical</p>
            <p className="text-3xl font-bold text-soc-alert">{alertStats.critical}</p>
          </div>
          <div className="bg-soc-card border border-yellow-500/30 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Warning</p>
            <p className="text-3xl font-bold text-soc-warning">{alertStats.warning}</p>
          </div>
          <div className="bg-soc-card border border-blue-500/30 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Info</p>
            <p className="text-3xl font-bold text-soc-accent">{alertStats.info}</p>
          </div>
        </div>

        {/* Severity Filter */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Filter by Severity:</label>
          <div className="flex space-x-3">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                severityFilter === 'all'
                  ? 'bg-soc-accent text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                severityFilter === 'critical'
                  ? 'bg-soc-alert text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setSeverityFilter('warning')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                severityFilter === 'warning'
                  ? 'bg-soc-warning text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setSeverityFilter('info')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                severityFilter === 'info'
                  ? 'bg-soc-accent text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Info
            </button>
          </div>
        </div>

        {/* Alerts Table */}
        <AlertsTable alerts={filteredAlerts} />
      </div>
    </div>
  );
};

export default Alerts;
