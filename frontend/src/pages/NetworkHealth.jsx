import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import RefreshTimer from '../components/RefreshTimer';
import Loader from '../components/Loader';
import { 
  getDomainPolicies, 
  addBlockedDomain, 
  addAllowedDomain, 
  removeDomainPolicy,
  getFirewallRules,
  getPolicySummary
} from '../services/api';
import { Shield, AlertTriangle, CheckCircle, Plus, Trash2, Lock, Unlock } from 'lucide-react';

const NetworkHealth = () => {
  const [policies, setPolicies] = useState(null);
  const [firewallRules, setFirewallRules] = useState([]);
  const [policySummary, setPolicySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [newDomain, setNewDomain] = useState('');
  const [newDomainReason, setNewDomainReason] = useState('');
  const [activeTab, setActiveTab] = useState('policies');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policiesData, rulesData, summaryData] = await Promise.all([
        getDomainPolicies(),
        getFirewallRules(),
        getPolicySummary()
      ]);
      setPolicies(policiesData);
      setFirewallRules(rulesData.rules || []);
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
    if (!newDomain.trim()) return;
    
    try {
      await addBlockedDomain(newDomain, newDomainReason || 'Policy violation');
      setNewDomain('');
      setNewDomainReason('');
      fetchData();
      alert(`Domain ${newDomain} added to block list`);
    } catch (error) {
      alert(`Failed to add blocked domain: ${error}`);
    }
  };

  const handleAddAllowedDomain = async () => {
    if (!newDomain.trim()) return;
    
    try {
      await addAllowedDomain(newDomain);
      setNewDomain('');
      fetchData();
      alert(`Domain ${newDomain} added to allow list`);
    } catch (error) {
      alert(`Failed to add allowed domain: ${error}`);
    }
  };

  const handleRemoveDomain = async (domain) => {
    if (!confirm(`Remove ${domain} from all policy lists?`)) return;
    
    try {
      await removeDomainPolicy(domain);
      fetchData();
      alert(`Domain ${domain} removed from policies`);
    } catch (error) {
      alert(`Failed to remove domain: ${error}`);
    }
  };

  const handleBlockDomainFirewall = async (domain) => {
    if (!confirm(`Add ${domain} to blocked domains policy list?`)) return;
    
    try {
      await addBlockedDomain(domain, 'Admin policy');
      fetchData();
      alert(`✅ Domain "${domain}" added to blocked domains policy list.\n\nThis is a policy record for network monitoring.\nTo actively block on student machines, use the Students page.`);
    } catch (error) {
      alert(`Failed to add domain to policy list: ${error}`);
    }
  };

  const handleUnblock = async (target) => {
    if (!confirm(`Unblock ${target}?`)) return;
    
    try {
      await unblockResource(target);
      fetchData();
      alert(`Resource ${target} unblocked`);
    } catch (error) {
      alert(`Failed to unblock: ${error}`);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-neon-cyan" />
              <p className="text-gray-400">Allowed Domains</p>
            </div>
            <p className="text-3xl font-bold text-status-success">
              {policySummary?.allowed_domains_count || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
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
            transition={{ delay: 0.2 }}
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

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-neon-blue" />
              <p className="text-gray-400">Active Rules</p>
            </div>
            <p className="text-3xl font-bold text-neon-blue">
              {firewallRules.length}
            </p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-cyber-border">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'policies'
                  ? 'text-neon-cyan border-b-2 border-neon-cyan'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Domain Policies
            </button>
            <button
              onClick={() => setActiveTab('firewall')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'firewall'
                  ? 'text-neon-cyan border-b-2 border-neon-cyan'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Firewall Rules
            </button>
          </div>
        </div>

        {/* Domain Policies Tab */}
        {activeTab === 'policies' && (
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Domain (e.g., facebook.com)"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="px-4 py-2 bg-cyber-darker border border-cyber-border rounded-lg text-gray-200 focus:outline-none focus:border-neon-cyan"
                />
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={newDomainReason}
                  onChange={(e) => setNewDomainReason(e.target.value)}
                  className="px-4 py-2 bg-cyber-darker border border-cyber-border rounded-lg text-gray-200 focus:outline-none focus:border-neon-cyan"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddBlockedDomain}
                    className="flex-1 px-4 py-2 bg-status-critical hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Block
                  </button>
                  <button
                    onClick={handleAddAllowedDomain}
                    className="flex-1 px-4 py-2 bg-status-success hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Allow
                  </button>
                </div>
              </div>
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
                      <span className="text-gray-300">{domain}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBlockDomainFirewall(domain)}
                          className="px-3 py-1 bg-status-warning hover:bg-yellow-600 text-white rounded text-sm transition-colors"
                        >
                          Apply Firewall
                        </button>
                        <button
                          onClick={() => handleRemoveDomain(domain)}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No blocked domains</p>
                )}
              </div>
            </div>

            {/* Allowed Domains */}
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-status-success" />
                Allowed Domains ({policies?.allowed_domains?.length || 0})
              </h4>
              <div className="space-y-2">
                {policies?.allowed_domains?.length > 0 ? (
                  policies.allowed_domains.map((domain, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-cyber-darker rounded-lg border border-cyber-border hover:border-status-success transition-colors"
                    >
                      <span className="text-gray-300">{domain}</span>
                      <button
                        onClick={() => handleRemoveDomain(domain)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No allowed domains</p>
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
        )}

        {/* Firewall Rules Tab */}
        {activeTab === 'firewall' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-cyber-card border border-cyber-border rounded-xl p-6"
          >
            <h4 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-neon-blue" />
              Active Firewall Blocking Rules ({firewallRules.length})
            </h4>
            <div className="space-y-2">
              {firewallRules.length > 0 ? (
                firewallRules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-cyber-darker rounded-lg border border-cyber-border hover:border-neon-blue transition-colors"
                  >
                    <div>
                      <p className="text-gray-300 font-medium">{rule.name}</p>
                      <p className="text-sm text-gray-500">Target: {rule.target || 'N/A'}</p>
                    </div>
                    <button
                      onClick={() => handleUnblock(rule.target)}
                      className="px-4 py-2 bg-status-success hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      Unblock
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No active firewall rules</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NetworkHealth;
