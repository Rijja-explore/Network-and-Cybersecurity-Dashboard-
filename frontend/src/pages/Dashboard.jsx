import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import RefreshTimer from '../components/RefreshTimer';
import Loader from '../components/Loader';
import { getWeeklyStats, getActiveAlerts, fetchLogs, addBlockedDomain, blockDomainOnStudent } from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Server, AlertTriangle, TrendingUp, Wifi, X, Shield, Lock } from 'lucide-react';

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
      // Send remote block command to student machine
      await blockDomainOnStudent(studentId, domain, 'Blocked from dashboard');
      alert(`✅ Block command sent!\n\nDomain: ${domain}\nStudent: ${studentId}\n\nThe student agent will enforce this block within a few seconds.`);
      
      // Refresh data after a short delay
      setTimeout(() => fetchData(), 500);
    } catch (error) {
      console.error('Error blocking domain:', error);
      alert(`❌ Failed to block domain: ${error}`);
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
              Last updated: {lastUpdated.toLocaleTimeString()}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bandwidth Usage Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6 shadow-neon-blue/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-full filter blur-3xl"></div>
            <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-blue" />
              Top Bandwidth Consumers
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bandwidthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {severityData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-400">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

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
                        {/* Show destinations if available, otherwise fallback to websites */}
                        {(log.destinations && log.destinations.length > 0) ? (
                          <>
                            {log.destinations.slice(0, 2).map((dest, i) => {
                              const displayText = dest.domain || `${dest.ip}:${dest.port || '?'}`;
                              const tooltipText = dest.domain 
                                ? `${dest.domain} (${dest.ip}:${dest.port})`
                                : `${dest.ip}:${dest.port}`;
                              
                              return (
                                <span 
                                  key={i} 
                                  className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan text-xs rounded-full"
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
                      {log.timestamp}
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

              {/* Destinations List */}
              <div className="space-y-2">
                {(selectedStudent.destinations && selectedStudent.destinations.length > 0) ? (
                  selectedStudent.destinations.map((dest, index) => {
                    const displayName = dest.domain || dest.ip;
                    const fullInfo = dest.domain 
                      ? `${dest.domain} (${dest.ip}:${dest.port})`
                      : `${dest.ip}:${dest.port}`;
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-cyber-darker rounded-lg border border-cyber-border/50 hover:border-neon-cyan/30 transition-colors group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-neon-cyan" />
                            <p className="text-gray-200 font-medium">{displayName}</p>
                          </div>
                          <p className="text-xs text-gray-500 ml-6">{fullInfo}</p>
                        </div>
                        <button
                          onClick={() => handleBlockDomain(dest.domain || dest.ip, selectedStudent?.hostname)}
                          disabled={blockingDomain === (dest.domain || dest.ip)}
                          className="px-3 py-1.5 bg-status-critical/20 hover:bg-status-critical/30 text-status-critical rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {blockingDomain === (dest.domain || dest.ip) ? (
                            <>
                              <div className="w-4 h-4 border-2 border-status-critical border-t-transparent rounded-full animate-spin"></div>
                              Blocking...
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              Block
                            </>
                          )}
                        </button>
                      </motion.div>
                    );
                  })
                ) : (selectedStudent.websites && selectedStudent.websites.length > 0) ? (
                  selectedStudent.websites.map((website, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-cyber-darker rounded-lg border border-cyber-border/50 hover:border-neon-cyan/30 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-neon-cyan" />
                          <p className="text-gray-200 font-medium">{website}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleBlockDomain(website, selectedStudent?.hostname)}
                        disabled={blockingDomain === website}
                        className="px-3 py-1.5 bg-status-critical/20 hover:bg-status-critical/30 text-status-critical rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {blockingDomain === website ? (
                          <>
                            <div className="w-4 h-4 border-2 border-status-critical border-t-transparent rounded-full animate-spin"></div>
                            Blocking...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Block
                          </>
                        )}
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No network destinations found</p>
                )}
              </div>

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
