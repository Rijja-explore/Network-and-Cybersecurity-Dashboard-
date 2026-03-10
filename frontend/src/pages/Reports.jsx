import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import WeeklyReportTable from '../components/WeeklyReportTable';
import { reportsAPI } from '../services/api';
import { RefreshCw, Download, FileText, AlertCircle } from 'lucide-react';

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await reportsAPI.getWeeklyReport();
      if (response.data.success) {
        setReportData(response.data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Failed to fetch report data');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV download
  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      await reportsAPI.downloadWeeklyCSV();
    } catch (err) {
      console.error('Error downloading CSV:', err);
      alert('Failed to download CSV. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Handle PDF download (placeholder)
  const handleDownloadPDF = () => {
    alert('PDF export is coming soon! For now, please use CSV export.');
  };

  // Initial fetch
  useEffect(() => {
    fetchReportData();
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 ml-64">
      <Navbar title="Reports" />

      <div className="p-8">
        {/* Header with Actions */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-soc-text mb-2">Weekly Security Reports</h3>
            <p className="text-sm text-gray-400">
              Comprehensive reports for network monitoring and security analysis
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {formatDate(lastUpdated)} at {formatTime(lastUpdated)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="px-4 py-2 bg-cyber-card hover:bg-gray-700 border border-cyber-border text-soc-text rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={loading || downloading || !reportData}
              className="px-4 py-2 bg-neon-blue hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : 'Download CSV'}</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-400">Error Loading Report</h3>
                <p className="text-sm text-red-300 mt-1">{error}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Make sure the backend is running on port 8000
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Report Period Card */}
        {reportData && reportData.report_period && (
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <FileText className="w-6 h-6 text-neon-blue" />
                  <h4 className="text-2xl font-bold text-soc-text">Weekly Report</h4>
                </div>
                <p className="text-gray-400 mb-4">
                  Period: {reportData.report_period.start_date} to {reportData.report_period.end_date}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Health Status</p>
                    <p className={`text-lg font-bold ${
                      reportData.executive_summary?.health_status === 'healthy' 
                        ? 'text-green-400' 
                        : reportData.executive_summary?.health_status === 'warning'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {reportData.executive_summary?.health_status || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Risk Level</p>
                    <p className={`text-lg font-bold ${
                      reportData.executive_summary?.risk_level === 'low' 
                        ? 'text-green-400' 
                        : reportData.executive_summary?.risk_level === 'medium'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {reportData.executive_summary?.risk_level || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleDownloadCSV}
                  disabled={downloading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>CSV Export</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium opacity-60 cursor-not-allowed flex items-center space-x-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>PDF (Soon)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Statistics */}
        {reportData && reportData.executive_summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <p className="text-gray-400 mb-2 text-sm">Total Alerts</p>
              <p className="text-3xl font-bold text-red-400">
                {reportData.executive_summary.total_alerts || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {reportData.executive_summary.critical_alerts || 0} critical
              </p>
            </div>
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <p className="text-gray-400 mb-2 text-sm">Active Students</p>
              <p className="text-3xl font-bold text-neon-blue">
                {reportData.executive_summary.active_students || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">monitored users</p>
            </div>
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <p className="text-gray-400 mb-2 text-sm">Total Bandwidth</p>
              <p className="text-3xl font-bold text-neon-cyan">
                {reportData.executive_summary.total_bandwidth_gb 
                  ? `${reportData.executive_summary.total_bandwidth_gb.toFixed(2)} GB`
                  : '0 GB'}
              </p>
              <p className="text-xs text-gray-500 mt-1">this week</p>
            </div>
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <p className="text-gray-400 mb-2 text-sm">Blocked Connections</p>
              <p className="text-3xl font-bold text-neon-purple">
                {reportData.executive_summary.blocked_connections || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">security blocks</p>
            </div>
          </div>
        )}

        {/* Weekly Report Table */}
        <WeeklyReportTable
          reportData={reportData}
          loading={loading}
          onDownloadCSV={handleDownloadCSV}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>
    </div>
  );
};

export default Reports;
