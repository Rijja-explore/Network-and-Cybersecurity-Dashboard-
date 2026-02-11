import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StudentsTable from '../components/StudentsTable';
import RefreshTimer from '../components/RefreshTimer';
import Loader from '../components/Loader';
import { getStudents, blockDomainOnStudent, unblockDomainOnStudent } from '../services/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getStudents();
      setStudents(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch students:', error);
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



  const handleBlockWebsite = async (studentId, domain) => {
    try {
      const result = await blockDomainOnStudent(studentId, domain, 'Blocked by admin from dashboard');
      alert(`✅ Block command sent!\n\nDomain: ${domain}\nStudent: ${studentId}\n\nThe student agent will enforce this block within a few seconds.`);
      fetchData(); // Refresh the list
    } catch (error) {
      alert(`❌ Failed to block website: ${error}`);
    }
  };

  const handleUnblockWebsite = async (studentId, domain) => {
    try {
      const result = await unblockDomainOnStudent(studentId, domain, 'Unblocked by admin from dashboard');
      alert(`✅ Unblock command sent!\n\nDomain: ${domain}\nStudent: ${studentId}\n\nThe student agent will restore access within a few seconds.`);
      fetchData(); // Refresh the list
    } catch (error) {
      alert(`❌ Failed to unblock website: ${error}`);
    }
  };

  const totalBandwidth = students.reduce((sum, student) => sum + (student.bandwidth || 0), 0);
  const formatBandwidth = (bytes) => {
    const gb = bytes / 1024 / 1024 / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex-1 ml-64">
        <Navbar title="Endpoints / Students" />
        <div className="p-8 h-96">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-64">
      <Navbar title="Endpoints / Students" />

      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-soc-text">Active Network Endpoints</h3>
            <p className="text-sm text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <RefreshTimer seconds={countdown} onRefresh={handleManualRefresh} />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Total Endpoints</p>
            <p className="text-3xl font-bold text-soc-text">{students.length}</p>
          </div>
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Total Bandwidth Usage</p>
            <p className="text-3xl font-bold text-soc-accent">{formatBandwidth(totalBandwidth)}</p>
          </div>
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Active Connections</p>
            <p className="text-3xl font-bold text-soc-success">{students.length}</p>
          </div>
        </div>

        {/* Students Table */}
        <StudentsTable 
          students={students} 
          onBlockWebsite={handleBlockWebsite}
          onUnblockWebsite={handleUnblockWebsite}
        />
      </div>
    </div>
  );
};

export default Students;
