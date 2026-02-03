import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import RefreshTimer from '../components/RefreshTimer';
import Loader from '../components/Loader';
import { getNetworkHealth } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const NetworkHealth = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getNetworkHealth();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch network health:', error);
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

  const handleManualRefresh = () => {
    setCountdown(5);
    fetchData();
  };

  const getHealthStatus = () => {
    const status = healthData?.status || 'Unknown';
    const statusConfig = {
      Healthy: { color: 'text-soc-success', bg: 'bg-green-500/10', border: 'border-green-500/50', icon: '✅' },
      Warning: { color: 'text-soc-warning', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', icon: '⚠️' },
      Critical: { color: 'text-soc-alert', bg: 'bg-red-500/10', border: 'border-red-500/50', icon: '🔴' },
    };
    return statusConfig[status] || statusConfig.Warning;
  };

  if (loading && !healthData) {
    return (
      <div className="flex-1 ml-64">
        <Navbar title="Network Health" />
        <div className="p-8 h-96">
          <Loader />
        </div>
      </div>
    );
  }

  const statusStyle = getHealthStatus();

  return (
    <div className="flex-1 ml-64">
      <Navbar title="Network Health" />

      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-soc-text">Real-time Network Monitoring</h3>
            <p className="text-sm text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <RefreshTimer seconds={countdown} onRefresh={handleManualRefresh} />
        </div>

        {/* Health Status Card */}
        <div className={`${statusStyle.bg} border ${statusStyle.border} rounded-xl p-8 mb-8`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 mb-2">Current Network Status</p>
              <div className="flex items-center space-x-3">
                <span className="text-4xl">{statusStyle.icon}</span>
                <h2 className={`text-4xl font-bold ${statusStyle.color}`}>
                  {healthData?.status || 'Unknown'}
                </h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 mb-2">Active Systems</p>
              <p className="text-4xl font-bold text-soc-accent">{healthData?.activeSystems || 0}</p>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bandwidth Usage Chart */}
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-soc-text mb-4">Bandwidth Usage (Last 10 Minutes)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={healthData?.bandwidthHistory || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bandwidth"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Active Systems Chart */}
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-soc-text mb-4">Active Systems Count</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={healthData?.systemsHistory || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                />
                <Bar dataKey="count" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Total Bandwidth</p>
            <p className="text-2xl font-bold text-soc-text">{healthData?.totalBandwidth || '0 GB'}</p>
          </div>
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Average Latency</p>
            <p className="text-2xl font-bold text-soc-text">{healthData?.avgLatency || '0 ms'}</p>
          </div>
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Packet Loss</p>
            <p className="text-2xl font-bold text-soc-text">{healthData?.packetLoss || '0%'}</p>
          </div>
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Network Load</p>
            <p className="text-2xl font-bold text-soc-text">{healthData?.networkLoad || 'Low'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkHealth;
