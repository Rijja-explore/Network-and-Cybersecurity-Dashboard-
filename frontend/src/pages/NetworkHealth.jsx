import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import RefreshTimer from '../components/RefreshTimer';
import Loader from '../components/Loader';
import { getDomainPolicies, addBlockedDomain, removeDomainPolicy, getPolicySummary, getFirewallRules, fetchLogs, testBlockedProcesses, getStudents, blockDomainOnStudent } from '../services/api';
import { Lock, Unlock, Plus, AlertTriangle, Shield, Activity, Server, Network, CheckCircle, Play } from 'lucide-react';

const NetworkHealth = () => {
  const [policies, setPolicies] = useState({ blocked_domains: [], blocked_keywords: [] });
  const [policySummary, setPolicySummary] = useState(null);
  const [firewallRules, setFirewallRules] = useState({ rules: [], count: 0 });
  const [systemHealth, setSystemHealth] = useState(null);
  const [networkStats, setNetworkStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [newDomain, setNewDomain] = useState('');
  const [newDomainReason, setNewDomainReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, s, firewall, logs] = await Promise.all([
        getDomainPolicies(), 
        getPolicySummary(),
        getFirewallRules(),
        fetchLogs()
      ]);
      
      setPolicies(p || { blocked_domains: [], blocked_keywords: [] });
      setPolicySummary(s || {});
      setFirewallRules(firewall || { rules: [], count: 0 });
      
      // Calculate real-time system health from student logs
      if (logs && logs.length > 0) {
        const activeStudents = logs.length;
        const avgCPU = logs.reduce((sum, log) => sum + (log.cpu || 0), 0) / activeStudents;
        const avgMemory = logs.reduce((sum, log) => sum + (log.memory || 0), 0) / activeStudents;
        const totalBandwidth = logs.reduce((sum, log) => sum + (log.network || 0), 0);
        const totalConnections = logs.reduce((sum, log) => sum + (log.connections || 0), 0);
        
        setSystemHealth({
          activeEndpoints: activeStudents,
          avgCPU: avgCPU.toFixed(1),
          avgMemory: avgMemory.toFixed(1),
          totalBandwidthMB: (totalBandwidth / 1024 / 1024).toFixed(2),
          totalConnections,
          status: avgCPU > 80 || avgMemory > 85 ? 'warning' : 'healthy'
        });
        
        setNetworkStats({
          totalTraffic: (totalBandwidth / 1024 / 1024).toFixed(2),
          peakConnections: Math.max(...logs.map(log => log.connections || 0)),
          uniqueDomains: [...new Set(logs.flatMap(log => log.websites || []))].length,
          alertsCount: logs.filter(log => (log.cpu || 0) > 80 || (log.memory || 0) > 85).length
        });
      } else {
        setSystemHealth({
          activeEndpoints: 0,
          avgCPU: '0',
          avgMemory: '0',
          totalBandwidthMB: '0',
          totalConnections: 0,
          status: 'idle'
        });
        
        setNetworkStats({
          totalTraffic: '0',
          peakConnections: 0,
          uniqueDomains: 0,
          alertsCount: 0
        });
      }
    } catch (e) {
      console.error('Failed to load policy data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          setLastUpdated(new Date());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddBlockedDomain = async () => {
    if (!newDomain.trim()) {
      alert('Please enter a domain name');
      return;
    }
    try {
      const response = await addBlockedDomain(newDomain, newDomainReason || 'Admin policy');
      setNewDomain('');
      setNewDomainReason('');
      // Force immediate refresh
      await fetchData();
      
      const result = response && response.global_command ? response.global_command : null;
      if (result && result.commands_created > 0) {
        const msg = 'Domain blocked successfully!\n\nDomain: ' + newDomain + '\nStudents affected: ' + result.commands_created + '\n\nBlock commands sent to: ' + (result.students ? result.students.join(', ') : '') + '\n\nStudent agents will enforce this block within a few seconds.';
        alert(msg);
      } else {
        alert('Domain "' + newDomain + '" added to block list.\n\nNo active students found. Block will apply when students connect.');
      }
    } catch (error) {
      alert('Failed to add blocked domain: ' + (error && error.toString ? error.toString() : error));
      // Refresh anyway to show any partial changes
      fetchData();
    }
  };

  const handleUnblockDomain = async (domain) => {
    if (!confirm('Unblock ' + domain + ' for all students?')) return;
    try {
      const response = await removeDomainPolicy(domain);
      // Force immediate refresh
      await fetchData();
      
      const result = response && response.global_command ? response.global_command : null;
      if (result && result.commands_created > 0) {
        const msg = 'Domain unblocked successfully!\n\nDomain: ' + domain + '\nStudents affected: ' + result.commands_created + '\n\nUnblock commands sent to: ' + (result.students ? result.students.join(', ') : '') + '\n\nAccess will be restored within a few seconds.';
        alert(msg);
      } else {
        alert('Domain ' + domain + ' removed from block list');
      }
    } catch (error) {
      alert('Failed to unblock domain: ' + (error && error.toString ? error.toString() : error));
      // Refresh anyway in case it partially worked
      fetchData();
    }
  };

  const handleTestBlockedProcesses = async () => {
    try {
      // 1. Run the standard test to trigger policy violations
      const result = await testBlockedProcesses();

      // 2. Fetch all currently connected students
      const allStudents = await getStudents();
      if (!allStudents || allStudents.length === 0) {
        alert(`✅ Policy test triggered.\n\nNo connected students found to push block commands.`);
        fetchData();
        return;
      }

      // 3. For each student, block all their currently open websites
      const BLOCKED_DOMAINS = ['thepiratebay.org', 'torrent.com', 'bittorrent.com', 'proxy.com', 'vpn.com'];
      let totalBlocked = 0;
      const studentResults = [];

      for (const student of allStudents) {
        const sitesToBlock = [
          ...BLOCKED_DOMAINS,
          ...(student.open_tabs || []),
        ];
        const unique = [...new Set(sitesToBlock)].filter(Boolean);
        try {
          await Promise.all(unique.map(domain =>
            blockDomainOnStudent(student.hostname, domain, 'Auto-block: policy violation test')
          ));
          totalBlocked += unique.length;
          studentResults.push(`${student.hostname}: ${unique.length} sites`);
        } catch (e) {
          studentResults.push(`${student.hostname}: failed`);
        }
      }

      alert(
        `✅ Auto-Block Test Complete!\n\n` +
        `Students targeted: ${allStudents.length}\n` +
        `Total block commands sent: ${totalBlocked}\n\n` +
        `Per student:\n${studentResults.join('\n')}\n\n` +
        `Check each student agent — blocks will apply within seconds.`
      );
      fetchData();
    } catch (error) {
      console.error('Failed to run auto-block test:', error);
      alert(`❌ Failed to run auto-block test: ${error}`);
    }
  };

  if (loading) return (
    <div className="flex-1 ml-64 bg-cyber-dark min-h-screen">
      <Navbar title="Policy Management" />
      <div className="p-8 h-96"><Loader /></div>
    </div>
  );

  return (
    <div className="flex-1 ml-64 bg-cyber-dark min-h-screen">
      <Navbar title="Network Health & Policy Management" />

      <div className="p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-300">Real-time Network Health Dashboard</h3>
            <p className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
          <RefreshTimer seconds={countdown} onRefresh={() => { setCountdown(30); fetchData(); setLastUpdated(new Date()); }} />
        </motion.div>

        {/* Real-time System Health Cards */}
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Server className="w-5 h-5 text-neon-blue" />
                <p className="text-gray-400">Active Endpoints</p>
              </div>
              <p className="text-3xl font-bold text-neon-blue">{systemHealth.activeEndpoints}</p>
              <p className="text-xs text-gray-500 mt-1">Connected students</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-status-success" />
                <p className="text-gray-400">Avg CPU Usage</p>
              </div>
              <p className={`text-3xl font-bold ${parseFloat(systemHealth.avgCPU) > 80 ? 'text-status-critical' : 'text-status-success'}`}>
                {systemHealth.avgCPU}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Across all endpoints</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Network className="w-5 h-5 text-neon-cyan" />
                <p className="text-gray-400">Network Traffic</p>
              </div>
              <p className="text-3xl font-bold text-neon-cyan">{systemHealth.totalBandwidthMB} MB</p>
              <p className="text-xs text-gray-500 mt-1">Total bandwidth used</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className={`w-5 h-5 ${systemHealth.status === 'healthy' ? 'text-status-success' : systemHealth.status === 'warning' ? 'text-status-warning' : 'text-gray-500'}`} />
                <p className="text-gray-400">System Status</p>
              </div>
              <p className={`text-3xl font-bold capitalize ${
                systemHealth.status === 'healthy' ? 'text-status-success' : 
                systemHealth.status === 'warning' ? 'text-status-warning' : 
                'text-gray-500'
              }`}>
                {systemHealth.status}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {systemHealth.status === 'healthy' ? 'All systems normal' : 
                 systemHealth.status === 'warning' ? 'High resource usage' : 
                 'No activity detected'}
              </p>
            </motion.div>
          </div>
        )}

        {/* Network Statistics */}
        {networkStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-status-success" />
                <p className="text-gray-400">Firewall Rules</p>
              </div>
              <p className="text-3xl font-bold text-status-success">{firewallRules.count}</p>
              <p className="text-xs text-gray-500 mt-1">Active blocking rules</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Network className="w-5 h-5 text-neon-purple" />
                <p className="text-gray-400">Peak Connections</p>
              </div>
              <p className="text-3xl font-bold text-neon-purple">{networkStats.peakConnections}</p>
              <p className="text-xs text-gray-500 mt-1">Max per endpoint</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-neon-cyan" />
                <p className="text-gray-400">Unique Domains</p>
              </div>
              <p className="text-3xl font-bold text-neon-cyan">{networkStats.uniqueDomains}</p>
              <p className="text-xs text-gray-500 mt-1">Accessed today</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-status-warning" />
                <p className="text-gray-400">Performance Alerts</p>
              </div>
              <p className="text-3xl font-bold text-status-warning">{networkStats.alertsCount}</p>
              <p className="text-xs text-gray-500 mt-1">High resource usage</p>
            </motion.div>
          </div>
        )}

        {/* Policy Management Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mb-6">
          <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-neon-cyan" />
            Domain Policy Management
          </h3>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2"><Lock className="w-5 h-5 text-status-critical" /><p className="text-gray-400">Blocked Domains</p></div>
            <p className="text-3xl font-bold text-status-critical">{policySummary?.blocked_domains_count || 0}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2"><AlertTriangle className="w-5 h-5 text-status-warning" /><p className="text-gray-400">Blocked Keywords</p></div>
            <p className="text-3xl font-bold text-status-warning">{policySummary?.blocked_keywords_count || 0}</p>
          </motion.div>
        </div>

        {/* Blocked Domains Management */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Test Auto-Blocking Functionality */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <h4 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-neon-purple" />
              Test Auto-Blocking System
            </h4>
            <p className="text-gray-400 mb-4">
              Test the automatic blocking system by simulating a student with blocked processes (torrent, proxy, nmap).
              This will trigger policy violations and automatic domain blocking.
            </p>
            <button
              onClick={handleTestBlockedProcesses}
              className="px-4 py-2 bg-neon-purple hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <Play className="w-4 h-4" />
              Run Auto-Block Test
            </button>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <h4 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-neon-cyan" />Add Domain Policy</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Domain (e.g., facebook.com)" value={newDomain} onChange={(e)=>setNewDomain(e.target.value)} onKeyPress={(e)=> e.key === 'Enter' && handleAddBlockedDomain()} className="px-4 py-2 bg-cyber-darker border border-cyber-border rounded-lg text-gray-200 focus:outline-none" />
              <input type="text" placeholder="Reason (optional)" value={newDomainReason} onChange={(e)=>setNewDomainReason(e.target.value)} onKeyPress={(e)=> e.key === 'Enter' && handleAddBlockedDomain()} className="px-4 py-2 bg-cyber-darker border border-cyber-border rounded-lg text-gray-200 focus:outline-none" />
            </div>
            <button onClick={handleAddBlockedDomain} className="w-full mt-4 px-4 py-3 bg-status-critical hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"><Lock className="w-5 h-5" />Block Domain for All Students</button>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <h4 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-status-critical" />Blocked Domains ({policies?.blocked_domains?.length || 0})</h4>
            <div className="space-y-2">
              {policies?.blocked_domains?.length > 0 ? (
                policies.blocked_domains.map((domain, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-cyber-darker rounded-lg border border-cyber-border hover:border-status-critical transition-colors">
                    <span className="text-gray-300 font-mono">{domain}</span>
                    <button onClick={() => handleUnblockDomain(domain)} className="px-4 py-2 bg-status-success hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"><Unlock className="w-4 h-4" />Unblock</button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No blocked domains</p>
              )}
            </div>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <h4 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-status-warning" />Blocked Keywords (Process Monitoring)</h4>
            <div className="flex flex-wrap gap-2">
              {policies?.blocked_keywords?.map((keyword, index) => (
                <span key={index} className="px-3 py-1 bg-status-warning/20 text-status-warning rounded-full text-sm border border-status-warning/50">{keyword}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NetworkHealth;
