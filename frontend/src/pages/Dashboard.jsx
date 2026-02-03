import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import RefreshTimer from '../components/RefreshTimer';
import Loader from '../components/Loader';
import { getDashboardStats, getNetworkHealth } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [bandwidthData, setBandwidthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardData, networkData] = await Promise.all([
        getDashboardStats(),
        getNetworkHealth(),
      ]);

      setStats(dashboardData);

      // Prepare bandwidth trend data
      if (networkData.bandwidthHistory) {
        setBandwidthData(networkData.bandwidthHistory);
      } else {
        // Generate sample trend if not provided by API
        const sampleData = Array.from({ length: 10 }, (_, i) => ({
          time: `${i}m`,
          bandwidth: Math.random() * 100,
        }));
        setBandwidthData(sampleData);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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

  if (loading && !stats) {
    return (
      <div className="flex-1 ml-64">
        <Navbar title="Dashboard" />
        <div className="p-8 h-96">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-64">
      <Navbar title="Dashboard" />

      <div className="p-8">
        {/* Header with Timer */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-soc-text">System Overview</h3>
            <p className="text-sm text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <RefreshTimer seconds={countdown} onRefresh={handleManualRefresh} />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Systems"
            value={stats?.activeSystems || 0}
            icon="🖥️"
            color="blue"
            trend={{ positive: true, value: '+3' }}
          />
          <StatCard
            title="Total Alerts"
            value={stats?.totalAlerts || 0}
            icon="🚨"
            color="red"
            trend={{ positive: false, value: '+5' }}
          />
          <StatCard
            title="Bandwidth Used"
            value={stats?.totalBandwidth || '0 GB'}
            icon="📊"
            color="yellow"
          />
          <StatCard
            title="Network Health"
            value={stats?.networkStatus || 'Healthy'}
            icon="✅"
            color="green"
          />
        </div>

        {/* Bandwidth Trend Chart */}
        <div className="bg-soc-card border border-gray-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-soc-text mb-4">Bandwidth Usage Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bandwidthData}>
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

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <h4 className="text-gray-400 mb-2">Critical Alerts</h4>
            <p className="text-3xl font-bold text-soc-alert">{stats?.criticalAlerts || 0}</p>
          </div>
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <h4 className="text-gray-400 mb-2">Blocked Endpoints</h4>
            <p className="text-3xl font-bold text-soc-warning">{stats?.blockedEndpoints || 0}</p>
          </div>
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <h4 className="text-gray-400 mb-2">Uptime</h4>
            <p className="text-3xl font-bold text-soc-success">{stats?.uptime || '99.9%'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
