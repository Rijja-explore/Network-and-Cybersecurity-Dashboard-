import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import RefreshTimer from '../components/RefreshTimer';
import Loader from '../components/Loader';
import { getWeeklyStats, getActiveAlerts, fetchLogs, addBlockedDomain, blockDomainOnStudent, unblockDomainOnStudent } from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Server, AlertTriangle, TrendingUp, Wifi, X, Shield, Lock, Unlock } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDestinationsModal, setShowDestinationsModal] = useState(false);
  const [blockingDomain, setBlockingDomain] = useState(null);
  const [blockedDomains, setBlockedDomains] = useState(new Set());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [weeklyData, alertsData, logsData] = await Promise.all([
        getWeeklyStats(),
        getActiveAlerts(),
        fetchLogs(),
      ]);

      setStats(weeklyData);
      setAlerts(alertsData);
      setLogs(logsData);
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

  // Auto-refresh timer (FASTER for real-time alerts)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 10;  // Reduced from 30 to 10 seconds for real-time
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setCountdown(30);
    fetchData();
  };

  const handleShowDestinations = (log) => {
    setSelectedStudent(log);
    setShowDestinationsModal(true);
  };

  const handleBlockDomain = async (domain, studentId) => {
    if (!domain || !studentId) {
      alert('❌ Missing domain or student information');
      return;
    }
    
    setBlockingDomain(domain);
    try {
      const isCurrentlyBlocked = blockedDomains.has(domain);
      
      if (isCurrentlyBlocked) {
        // Unblock the domain
        await unblockDomainOnStudent(studentId, domain, 'Unblocked from dashboard');
        setBlockedDomains(prev => {
          const newSet = new Set(prev);
          newSet.delete(domain);
          return newSet;
        });
        alert(`✅ Unblock command sent!\n\nDomain: ${domain}\nStudent: ${studentId}\n\nThe student agent will restore access within a few seconds.`);
      } else {
        // Block the domain
        await blockDomainOnStudent(studentId, domain, 'Blocked from dashboard');
        setBlockedDomains(prev => new Set(prev).add(domain));
        alert(`✅ Block command sent!\n\nDomain: ${domain}\nStudent: ${studentId}\n\nThe student agent will enforce this block within a few seconds.`);
      }
      
      // Refresh data after a short delay
      setTimeout(() => fetchData(), 500);
    } catch (error) {
      console.error('Error blocking/unblocking domain:', error);
      alert(`❌ Failed to ${blockedDomains.has(domain) ? 'unblock' : 'block'} domain: ${error}`);
    } finally {
      setBlockingDomain(null);
    }
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

  // Prepare chart data
  const bandwidthData = stats?.top_bandwidth_hosts?.slice(0, 7).map(host => ({
    name: host.hostname,
    bandwidth: (host.total_bandwidth / 1024 / 1024).toFixed(2),
  })) || [];

  // CPU usage data from recent logs (realtime) - IST format
  const cpuData = logs.slice(0, 10).reverse().map((log, index) => ({
    time: new Date(log.raw_timestamp || log.timestamp).toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }),
    cpu: log.cpu || 0,
    hostname: log.hostname
  }));

  // Memory usage data from recent logs - IST format
  const memoryData = logs.slice(0, 10).reverse().map((log, index) => ({
    time: new Date(log.raw_timestamp || log.timestamp).toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }),
    memory: log.memory || 0,
    hostname: log.hostname
  }));

  // Disk usage data from latest logs per student
  const diskData = logs.reduce((acc, log) => {
    if (!acc.some(item => item.hostname === log.hostname)) {
      acc.push({
        hostname: log.hostname,
        disk: log.disk || 0
      });
    }
    return acc;
  }, []).slice(0, 7);

  // Active connections data from recent logs - IST format
  const connectionsData = logs.slice(0, 10).reverse().map((log, index) => ({
    time: new Date(log.raw_timestamp || log.timestamp).toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }),
    connections: log.connections || 0,
    hostname: log.hostname
  }));

  const severityData = stats?.alerts_by_severity ? [
    { name: 'Critical', value: stats.alerts_by_severity.critical || 0, color: '#ff0054' },
    { name: 'High', value: stats.alerts_by_severity.high || 0, color: '#ff4757' },
    { name: 'Medium', value: stats.alerts_by_severity.medium || 0, color: '#ffa502' },
    { name: 'Low', value: stats.alerts_by_severity.low || 0, color: '#00d4ff' },
  ] : [];

  return (
    <div className="flex-1 ml-64 bg-cyber-dark min-h-screen">
      <Navbar title="Dashboard" />

      <div className="p-8">
        {/* Header with Timer */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-300">System Overview</h3>
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
          <RefreshTimer seconds={countdown} onRefresh={handleManualRefresh} />
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Endpoints"
            value={stats?.active_students || 0}
            icon={Server}
            color="blue"
            delay={0}
          />
          <StatCard
            title="Security Alerts"
            value={stats?.alert_count || 0}
            icon={AlertTriangle}
            color="red"
            trend={{ positive: false, value: `${stats?.alert_count || 0} new` }}
            delay={0.1}
          />
          <StatCard
            title="Total Bandwidth"
            value={`${stats?.total_bandwidth_gb?.toFixed(2) || 0} GB`}
            icon={Activity}
            color="cyan"
            delay={0.2}
          />
          <StatCard
            title="Network Status"
            value={stats?.alert_count > 5 ? 'Warning' : 'Healthy'}
            icon={Wifi}
            color={stats?.alert_count > 5 ? 'yellow' : 'green'}
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Real-time CPU Usage Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6 shadow-neon-green/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-status-success/10 rounded-full filter blur-3xl"></div>
            <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-status-success" />
              Real-time CPU Usage
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={cpuData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6b7280" 
                  tick={{ fontSize: 10 }} 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  stroke="#6b7280" 
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  label={{ value: 'CPU %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1629',
                    border: '1px solid #1a2332',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                  labelStyle={{ color: '#10b981' }}
                  formatter={(value, name, props) => {
                    return [`${value.toFixed(1)}%`, props.payload.hostname];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>📊 Last 10 student updates</span>
              <span>Updates every {countdown}s</span>
            </div>
          </motion.div>

          {/* Bandwidth Usage Chart */}
          <motion.div
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6 shadow-neon-blue/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-full filter blur-3xl"></div>
            <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-blue" />
              Top Bandwidth Consumers
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bandwidthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1629',
                    border: '1px solid #1a2332',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                  labelStyle={{ color: '#00d4ff' }}
                />
                <Bar dataKey="bandwidth" fill="url(#bandwidthGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="bandwidthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#0099cc" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Alert Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6 shadow-neon-purple/20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-neon-purple/10 rounded-full filter blur-3xl"></div>
            <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-status-warning" />
              Alert Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1629',
                    border: '1px solid #1a2332',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {severityData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-gray-400">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Second Row: Memory, Disk, Connections Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Memory Usage Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6 shadow-neon-purple/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 rounded-full filter blur-3xl"></div>
            <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-neon-purple" />
              Real-time Memory Usage
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={memoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6b7280" 
                  tick={{ fontSize: 10 }} 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  stroke="#6b7280" 
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  label={{ value: 'Memory %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1629',
                    border: '1px solid #1a2332',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                  labelStyle={{ color: '#a855f7' }}
                  formatter={(value, name, props) => {
                    return [`${value.toFixed(1)}%`, props.payload.hostname];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  dot={{ fill: '#a855f7', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>💾 Last 10 student updates</span>
              <span>Updates every {countdown}s</span>
            </div>
          </motion.div>

          {/* Disk Usage Chart */}
          <motion.div
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6 shadow-neon-orange/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-status-warning/10 rounded-full filter blur-3xl"></div>
            <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-status-warning" />
              Disk Usage by Student
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={diskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                <XAxis 
                  dataKey="hostname" 
                  stroke="#6b7280" 
                  tick={{ fontSize: 10 }} 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                />
                <YAxis 
                  stroke="#6b7280" 
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  label={{ value: 'Disk %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1629',
                    border: '1px solid #1a2332',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                  labelStyle={{ color: '#ffa502' }}
                  formatter={(value) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="disk" fill="url(#diskGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="diskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffa502" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#ff6348" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>📂 Current disk usage per student</span>
            </div>
          </motion.div>

          {/* Active Connections Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6 shadow-neon-cyan/20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-neon-cyan/10 rounded-full filter blur-3xl"></div>
            <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-neon-cyan" />
              Active Network Connections
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={connectionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6b7280" 
                  tick={{ fontSize: 10 }} 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  stroke="#6b7280"
                  label={{ value: 'Connections', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1629',
                    border: '1px solid #1a2332',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                  labelStyle={{ color: '#00d4ff' }}
                  formatter={(value, name, props) => {
                    return [`${value} connections`, props.payload.hostname];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="connections" 
                  stroke="#00d4ff" 
                  strokeWidth={3}
                  dot={{ fill: '#00d4ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>🔗 Last 10 student updates</span>
              <span>Updates every {countdown}s</span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">

        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-cyber-card border border-cyber-border rounded-xl p-6 shadow-neon-red/20"
        >
          <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-status-critical" />
            Recent Security Alerts
          </h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-cyber-darker border border-cyber-border rounded-lg hover:border-neon-blue/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.severity === 'critical' ? 'bg-status-critical animate-pulse' :
                    alert.severity === 'high' ? 'bg-status-warning' :
                    'bg-status-info'
                  }`}></div>
                  <div>
                    <p className="text-gray-300 font-medium">{alert.hostname}</p>
                    <p className="text-sm text-gray-500">{alert.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    alert.severity === 'critical' ? 'bg-status-critical/20 text-status-critical' :
                    alert.severity === 'high' ? 'bg-status-warning/20 text-status-warning' :
                    'bg-status-info/20 text-status-info'
                  }`}>
                    {alert.severity}
                  </span>
                  <p className="text-xs text-gray-600 mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </motion.div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No active alerts - All systems secure</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* 📊 Live Student Activity Logs (STEP 3) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-cyber-card border border-cyber-border rounded-xl p-6 shadow-neon-cyan/20"
        >
          <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-cyan" />
            Live Student Activity Monitoring
            <span className="text-sm font-normal text-gray-500">
              ({logs.length} active connections)
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyber-border">
                  <th className="text-left py-3 px-2 font-medium text-neon-cyan">Student ID</th>
                  <th className="text-left py-3 px-2 font-medium text-neon-cyan">CPU %</th>
                  <th className="text-left py-3 px-2 font-medium text-neon-cyan">Network Usage</th>
                  <th className="text-left py-3 px-2 font-medium text-neon-cyan">Active Apps</th>
                  <th className="text-left py-3 px-2 font-medium text-neon-cyan">Destinations (IP/Domain)</th>
                  <th className="text-left py-3 px-2 font-medium text-neon-cyan">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 10).map((log, index) => (
                  <motion.tr
                    key={log.activity_id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    className="border-b border-cyber-border/50 hover:bg-cyber-darker/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-gray-300 font-medium">{log.student_id}</p>
                        <p className="text-xs text-gray-500">{log.hostname}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-2 bg-cyber-darker rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              log.cpu > 80 ? 'bg-status-critical' :
                              log.cpu > 60 ? 'bg-status-warning' : 
                              'bg-status-success'
                            }`}
                            style={{ width: `${log.cpu}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-300">{log.cpu}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-gray-300">{log.network_mb || (log.network / 1024 / 1024).toFixed(2)} MB</p>
                        <p className="text-xs text-gray-500">
                          ↑{((log.bytes_sent || 0) / 1024).toFixed(0)}KB ↓{((log.bytes_recv || 0) / 1024).toFixed(0)}KB
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1">
                        {(log.apps || log.active_apps || []).slice(0, 2).map((app, i) => (
                          <span 
                            key={i} 
                            className="px-2 py-1 bg-neon-blue/20 text-neon-blue text-xs rounded-full"
                          >
                            {app.replace('.exe', '')}
                          </span>
                        ))}
                        {(log.apps || log.active_apps || []).length > 2 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-full">
                            +{(log.apps || log.active_apps || []).length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1 max-w-xs items-center">
                        {/* Show destinations with domain names first, IPs as fallback */}
                        {(log.destinations && log.destinations.length > 0) ? (
                          <>
                            {log.destinations.slice(0, 2).map((dest, i) => {
                              // Prioritize domain names over IPs for admin readability
                              const displayText = dest.domain 
                                ? dest.domain
                                : dest.ip && dest.ip !== '127.0.0.1' && dest.ip !== '0.0.0.0'
                                  ? `${dest.ip}:${dest.port || '?'}`
                                  : 'Local Connection';
                              
                              const tooltipText = dest.domain 
                                ? `${dest.domain} (${dest.ip}:${dest.port})`
                                : `${dest.ip}:${dest.port}`;
                              
                              return (
                                <span 
                                  key={i} 
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    dest.domain 
                                      ? 'bg-neon-cyan/20 text-neon-cyan' 
                                      : 'bg-gray-600/20 text-gray-400'
                                  }`}
                                  title={tooltipText}
                                >
                                  {displayText.length > 20 ? displayText.substring(0, 20) + '...' : displayText}
                                </span>
                              );
                            })}
                            <button
                              onClick={() => handleShowDestinations(log)}
                              className="px-2 py-1 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple text-xs rounded-full cursor-pointer transition-colors flex items-center gap-1 font-medium"
                              title="Click to view all destinations and block websites"
                            >
                              {log.destinations.length > 2 ? `+${log.destinations.length - 2}` : 'View All'}
                              <Shield className="w-3 h-3" />
                            </button>
                          </>
                        ) : (log.websites && log.websites.length > 0) ? (
                          <>
                            {log.websites.slice(0, 2).map((site, i) => (
                              <span 
                                key={i} 
                                className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan text-xs rounded-full"
                                title={site}
                              >
                                {site.length > 20 ? site.substring(0, 20) + '...' : site}
                              </span>
                            ))}
                            <button
                              onClick={() => handleShowDestinations(log)}
                              className="px-2 py-1 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple text-xs rounded-full cursor-pointer transition-colors flex items-center gap-1 font-medium"
                              title="Click to view all websites and block"
                            >
                              {log.websites.length > 2 ? `+${log.websites.length - 2}` : 'View All'}
                              <Shield className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500 italic">No connections</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-400 text-xs">
                      {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No student activity detected</p>
              <p className="text-xs mt-2">Waiting for agent connections...</p>
            </div>
          )}
        </motion.div>
      </div>

      </div>

      {/* Destinations Modal */}
      <AnimatePresence>
        {showDestinationsModal && selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDestinationsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-cyber-card border border-cyber-border rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-200 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-neon-cyan" />
                    Network Destinations
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Student: <span className="text-neon-cyan font-medium">{selectedStudent.hostname}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowDestinationsModal(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Currently Open Tabs — highest priority */}
              {(() => {
                const openTabs = selectedStudent.open_tabs || [];
                // All destinations with a real domain (filter out raw IPs)
                const netDests = (selectedStudent.all_destinations || selectedStudent.destinations || [])
                  .filter(d => d && typeof d === 'object' && d.domain && d.domain !== d.ip);
                // Merge open_tabs + all_websites (deduplicated) for a single current list
                const openTabSet = new Set(openTabs);
                const allCurrent = [
                  ...openTabs,
                  ...(selectedStudent.all_websites || selectedStudent.websites || []).filter(s => !openTabSet.has(s))
                ];

                return (
                  <div className="space-y-4">
                    {/* All websites — merged, deduplicated */}
                    {(() => {
                      const merged = [...new Set([
                        ...allCurrent,
                        ...netDests.map(d => d.domain),
                      ])];
                      if (merged.length === 0) return (
                        <p className="text-center text-gray-500 py-8">No website data available for this student</p>
                      );
                      // Build domain → IP lookup from network destinations
                      const domainIpMap = {};
                      netDests.forEach(d => { if (d.domain && d.ip && d.ip !== d.domain) domainIpMap[d.domain] = d.ip; });

                      return (
                        <div>
                          <h3 className="text-sm font-semibold text-neon-cyan mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse inline-block"></span>
                            Websites ({merged.length})
                          </h3>
                          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                            {merged.map((site, i) => (
                              <motion.div key={i}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className="flex items-center justify-between p-2.5 bg-cyber-darker rounded-lg border border-cyber-border/50 hover:border-neon-cyan/30 transition-colors"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Wifi className="w-4 h-4 text-neon-cyan shrink-0" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-gray-200 font-medium text-sm truncate">{site}</span>
                                    {domainIpMap[site] && (
                                      <span className="text-gray-500 text-xs font-mono truncate">{domainIpMap[site]}</span>
                                    )}
                                  </div>
                                </div>
                                <button onClick={() => handleBlockDomain(site, selectedStudent?.hostname)}
                                  disabled={blockingDomain === site}
                                  className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 shrink-0 disabled:opacity-50 shadow ${
                                    blockedDomains.has(site)
                                      ? 'bg-gradient-to-r from-green-700 to-green-500 hover:from-green-600 hover:to-green-400 text-white'
                                      : 'bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white'
                                  }`}>
                                  {blockingDomain === site
                                    ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                    : blockedDomains.has(site)
                                      ? <><Unlock className="w-3 h-3"/>Unblock</>
                                      : <><Lock className="w-3 h-3"/>Block</>}
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {false && (
                      <p className="text-center text-gray-500 py-8">No website data available for this student</p>
                    )}
                  </div>
                );
              })()}

              {/* Footer Info */}
              <div className="mt-6 p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
                <p className="text-xs text-gray-400">
                  <strong className="text-neon-blue">💡 Tip:</strong> Blocking a domain adds it to your policy list. 
                  To apply Windows Firewall rules, go to <strong>Network Health → Domain Policies</strong> and click "Apply Firewall Block".
                  Firewall blocking requires running the backend as Administrator.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
