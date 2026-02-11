import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import RefreshTimer from '../components/RefreshTimer';
import Loader from '../components/Loader';
import { 
  getDomainPolicies, 
  addBlockedDomain, 
  removeDomainPolicy,
  getPolicySummary
} from '../services/api';
import { Shield, AlertTriangle, Lock, Unlock, Plus } from 'lucide-react';

const NetworkHealth = () => {
  const [policies, setPolicies] = useState(null);
  const [policySummary, setPolicySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [newDomain, setNewDomain] = useState('');
  const [newDomainReason, setNewDomainReason] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policiesData, summaryData] = await Promise.all([
        getDomainPolicies(),
        getPolicySummary()
      ]);
      setPolicies(policiesData);
      setPolicySummary(summaryData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch policy data:', error);
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

  const handleAddBlockedDomain = async () => {
    if (!newDomain.trim()) {
      alert('Please enter a domain name');
      return;
    }
    
    try {
      const response = await addBlockedDomain(newDomain, newDomainReason || 'Admin policy');
      setNewDomain('');
      setNewDomainReason('');
      fetchData();
      
      const result = response.global_command;
      if (result && result.commands_created > 0) {
        alert(`✅ Domain blocked successfully!\n\nDomain: ${newDomain}\nStudents affected: ${result.commands_created}\n\nBlock commands sent to: ${result.students.join(', ')}\n\nStudent agents will enforce this block within a few seconds.`);
      } else {
        alert(`✅ Domain "${newDomain}" added to block list.\n\nNo active students found. Block will apply when students connect.`);
      }
    } catch (error) {
      alert(`Failed to add blocked domain: ${error}`);
    }
  };

  const handleUnblockDomain = async (domain) => {
    if (!confirm(`Unblock ${domain} for all students?`)) return;
    
    try {
      const response = await removeDomainPolicy(domain);
      fetchData();
      
      const result = response.global_command;
      if (result && result.commands_created > 0) {
        alert(`✅ Domain unblocked successfully!\n\nDomain: ${domain}\nStudents affected: ${result.commands_created}\n\nUnblock commands sent to: ${result.students.join(', ')}\n\nAccess will be restored within a few seconds.`);
      } else {
        alert(`✅ Domain ${domain} removed from block list`);
      }
    } catch (error) {
      alert(`Failed to unblock domain: ${error}`);
    }
  };



  if (loading && !policies) {
    return (
      <div className="flex-1 ml-64 bg-cyber-dark min-h-screen">
        <Navbar title="Policy Management" />
        <div className="p-8 h-96">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-64 bg-cyber-dark min-h-screen">
      <Navbar title="Policy & Firewall Management" />

      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-300">Network Access Control</h3>
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <RefreshTimer seconds={countdown} onRefresh={handleManualRefresh} />
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-5 h-5 text-status-critical" />
              <p className="text-gray-400">Blocked Domains</p>
            </div>
            <p className="text-3xl font-bold text-status-critical">
              {policySummary?.blocked_domains_count || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-status-warning" />
              <p className="text-gray-400">Blocked Keywords</p>
            </div>
            <p className="text-3xl font-bold text-status-warning">
              {policySummary?.blocked_keywords_count || 0}
            </p>
          </motion.div>
        </div>

        {/* Blocked Domains Management */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Add New Domain */}
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-neon-cyan" />
                Add Domain Policy
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Domain (e.g., facebook.com)"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBlockedDomain()}
                  className="px-4 py-2 bg-cyber-darker border border-cyber-border rounded-lg text-gray-200 focus:outline-none focus:border-neon-cyan"
                />
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={newDomainReason}
                  onChange={(e) => setNewDomainReason(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBlockedDomain()}
                  className="px-4 py-2 bg-cyber-darker border border-cyber-border rounded-lg text-gray-200 focus:outline-none focus:border-neon-cyan"
                />
              </div>
              <button
                onClick={handleAddBlockedDomain}
                className="w-full mt-4 px-4 py-3 bg-status-critical hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Lock className="w-5 h-5" />
                Block Domain for All Students
              </button>
            </div>

            {/* Blocked Domains */}
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-status-critical" />
                Blocked Domains ({policies?.blocked_domains?.length || 0})
              </h4>
              <div className="space-y-2">
                {policies?.blocked_domains?.length > 0 ? (
                  policies.blocked_domains.map((domain, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-cyber-darker rounded-lg border border-cyber-border hover:border-status-critical transition-colors"
                    >
                      <span className="text-gray-300 font-mono">{domain}</span>
                      <button
                        onClick={() => handleUnblockDomain(domain)}
                        className="px-4 py-2 bg-status-success hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Unlock className="w-4 h-4" />
                        Unblock
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No blocked domains</p>
                )}
              </div>
            </div>

            {/* Blocked Keywords */}
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-status-warning" />
                Blocked Keywords (Process Monitoring)
              </h4>
              <div className="flex flex-wrap gap-2">
                {policies?.blocked_keywords?.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-status-warning/20 text-status-warning rounded-full text-sm border border-status-warning/50"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NetworkHealth;
