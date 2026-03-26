/**
 * Reports Page
 * ============
 * Displays detailed weekly reports with export functionality
 * 
 * INTEGRATION NOTES:
 * - Add date range picker when backend supports custom date queries
 * - Enable PDF download when backend implements PDF generation
 * - Add report scheduling feature in future iterations
 */

import React, { useState, useEffect } from 'react';
import { reportsAPI, healthCheck } from '../services/api';
import { WeeklyReportTable } from '../components';

const ReportsPage = () => {
  // State management
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const isHealthy = await healthCheck();
      if (!isHealthy) {
        throw new Error('Analytics API is not available. Please start the backend server.');
      }

      const response = await reportsAPI.getWeeklyReport();
      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReportData();
  }, []);

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
  const handleDownloadPDF = async () => {
    alert('PDF export is coming soon! For now, please use CSV export.');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <a
                  href="/"
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Detailed weekly analysis and insights
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <button
                onClick={fetchReportData}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Report</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Make sure the backend is running: <code className="bg-red-100 px-1 rounded">uvicorn main:app --reload --port 8000</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Report type selector (for future expansion) */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex space-x-2">
            <button className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg">
              Weekly Report
            </button>
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
              title="Coming soon"
            >
              Monthly Report
            </button>
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
              title="Coming soon"
            >
              Custom Range
            </button>
          </div>

          {/* Download indicator */}
          {downloading && (
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-blue-600">Preparing download...</span>
            </div>
          )}
        </div>

        {/* Weekly Report Table */}
        <WeeklyReportTable
          reportData={reportData}
          loading={loading}
          onDownloadCSV={handleDownloadCSV}
          onDownloadPDF={handleDownloadPDF}
        />

        {/* Report info section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export options */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Options</h3>
            <div className="space-y-3">
              <button
                onClick={handleDownloadCSV}
                disabled={loading || downloading}
                className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">Download CSV</p>
                    <p className="text-xs text-gray-500">Spreadsheet format</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded">Available</span>
              </button>

              <div className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-500">Download PDF</p>
                    <p className="text-xs text-gray-400">Formatted document</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">Coming Soon</span>
              </div>

              <div className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-500">Email Report</p>
                    <p className="text-xs text-gray-400">Send via email</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">Coming Soon</span>
              </div>
            </div>
          </div>

          {/* Report scheduling (future feature) */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Schedule</h3>
            <div className="text-center py-6">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-sm">
                Automated report scheduling will be available in a future update.
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Schedule daily, weekly, or monthly reports to be automatically generated and emailed.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Reports & Analytics Module
            </p>
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-700 mt-2 sm:mt-0"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ReportsPage;
