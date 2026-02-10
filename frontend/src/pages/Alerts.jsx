import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import RefreshTimer from '../components/RefreshTimer';
import Loader from '../components/Loader';
import { getAlerts, resolveAlert } from '../services/api';
import { AlertTriangle, CheckCircle, Filter, Search } from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter alerts
  useEffect(() => {
    let filtered = [...alerts];

    if (severityFilter !== 'all') {
      filtered = filtered.filter((alert) => alert.severity?.toLowerCase() === severityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((alert) => alert.status?.toLowerCase() === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter((alert) => 
        alert.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAlerts(filtered);
  }, [severityFilter, statusFilter, searchTerm, alerts]);

  const handleManualRefresh = () => {
    setCountdown(30);
    fetchData();
  };

  const handleResolve = async (alertId) => {
    try {
      await resolveAlert(alertId);
      fetchData();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const alertStats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity?.toLowerCase() === 'critical').length,
    high: alerts.filter((a) => a.severity?.toLowerCase() === 'high').length,
    medium: alerts.filter((a) => a.severity?.toLowerCase() === 'medium').length,
    active: alerts.filter((a) => a.status?.toLowerCase() === 'active').length,
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex-1 ml-64 bg-cyber-dark min-h-screen">
        <Navbar title="Security Alerts" />
        <div className="p-8 h-96">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-64 bg-cyber-dark min-h-screen">
      <Navbar title="Security Alerts" />

      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-300">Active Security Alerts</h3>
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <RefreshTimer seconds={countdown} onRefresh={handleManualRefresh} />
        </motion.div>

        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total', value: alertStats.total, color: 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' },
            { label: 'Critical', value: alertStats.critical, color: 'bg-status-critical/10 border-status-critical/30 text-status-critical' },
            { label: 'High', value: alertStats.high, color: 'bg-status-warning/10 border-status-warning/30 text-status-warning' },
            { label: 'Medium', value: alertStats.medium, color: 'bg-status-info/10 border-status-info/30 text-status-info' },
            { label: 'Active', value: alertStats.active, color: 'bg-status-success/10 border-status-success/30 text-status-success' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.color} border rounded-xl p-4`}
            >
              <p className="text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-cyber-card border border-cyber-border rounded-xl p-6 mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-neon-blue" />
              <span className="text-gray-400 font-medium">Filters:</span>
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 bg-cyber-darker border border-cyber-border rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-blue"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-cyber-darker border border-cyber-border rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-blue"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>

            {/* Search */}
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-cyber-darker border border-cyber-border rounded-lg">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-gray-300 placeholder-gray-600 focus:outline-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Alerts Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cyber-darker border-b border-cyber-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Hostname</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border">
                <AnimatePresence>
                  {filteredAlerts.map((alert, index) => (
                    <motion.tr
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-cyber-darker transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className={`w-3 h-3 rounded-full ${
                          alert.severity === 'critical' ? 'bg-status-critical animate-pulse' :
                          alert.severity === 'high' ? 'bg-status-warning' :
                          alert.severity === 'medium' ? 'bg-status-info' :
                          'bg-gray-500'
                        }`}></div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 font-medium">{alert.hostname}</td>
                      <td className="px-6 py-4 text-gray-400">{alert.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          alert.severity === 'critical' ? 'bg-status-critical/20 text-status-critical' :
                          alert.severity === 'high' ? 'bg-status-warning/20 text-status-warning' :
                          alert.severity === 'medium' ? 'bg-status-info/20 text-status-info' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {alert.status === 'active' ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleResolve(alert.id)}
                            className="px-3 py-1 bg-status-success/20 hover:bg-status-success/30 text-status-success rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Resolve
                          </motion.button>
                        ) : (
                          <span className="text-gray-600 text-sm">Resolved</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filteredAlerts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No alerts found matching your filters</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Alerts;
