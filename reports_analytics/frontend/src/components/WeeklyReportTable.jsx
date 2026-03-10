/**
 * Weekly Report Table Component
 * =============================
 * Displays formatted weekly report data in various sections
 * 
 * Props:
 * - reportData: Object from /reports/weekly endpoint
 * - loading: Boolean for loading state
 * - onDownloadCSV: Function to trigger CSV download
 * - onDownloadPDF: Function to trigger PDF download (future)
 */

import React, { useState } from 'react';

const WeeklyReportTable = ({ reportData, loading, onDownloadCSV, onDownloadPDF }) => {
  const [activeSection, setActiveSection] = useState('summary');

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!reportData) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Report</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No report data available</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'summary', label: 'Summary' },
    { id: 'network', label: 'Network' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'students', label: 'Students' },
    { id: 'recommendations', label: 'Actions' },
  ];

  // Health status badge
  const HealthBadge = ({ status }) => {
    const styles = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${styles[status] || styles.warning}`}>
        {status}
      </span>
    );
  };

  // Risk level badge
  const RiskBadge = ({ level }) => {
    const styles = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[level] || styles.medium}`}>
        {level}
      </span>
    );
  };

  // Priority badge
  const PriorityBadge = ({ priority }) => {
    const styles = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500',
    };

    return (
      <span className={`w-2 h-2 rounded-full ${styles[priority] || styles.medium}`}></span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Weekly Report</h3>
            <p className="text-sm text-gray-500">
              {reportData.report_period?.start_date} to {reportData.report_period?.end_date}
            </p>
          </div>
          <div className="flex space-x-2 mt-3 sm:mt-0">
            <button
              onClick={onDownloadCSV}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Download CSV
            </button>
            <button
              onClick={onDownloadPDF}
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
              title="PDF export coming soon"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="px-6 py-3 border-b border-gray-200 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content sections */}
      <div className="p-6">
        {/* Executive Summary */}
        {activeSection === 'summary' && reportData.executive_summary && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Network Health Status</p>
                <p className="mt-1 text-lg font-medium text-gray-800">
                  {reportData.executive_summary.health_message}
                </p>
              </div>
              <HealthBadge status={reportData.executive_summary.health_status} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(reportData.executive_summary.key_metrics || {}).map(([key, value]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Highlights</h4>
              <ul className="space-y-2">
                {reportData.executive_summary.highlights?.map((highlight, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-sm text-gray-600">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Network Usage */}
        {activeSection === 'network' && reportData.network_usage && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">Total Bandwidth</p>
                <p className="text-2xl font-bold text-green-800">
                  {reportData.network_usage.total_bandwidth_mb?.toFixed(2)} MB
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">Peak Usage Hour</p>
                <p className="text-2xl font-bold text-blue-800">
                  {reportData.network_usage.peak_usage?.hour}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Bandwidth Consumers</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bandwidth (MB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.network_usage.top_consumers?.map((consumer, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">{consumer.student_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{consumer.bandwidth_mb}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Security Alerts */}
        {activeSection === 'alerts' && reportData.security_alerts && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-700">
                  {reportData.security_alerts.by_severity?.critical || 0}
                </p>
                <p className="text-sm text-red-600">Critical</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-700">
                  {reportData.security_alerts.by_severity?.warning || 0}
                </p>
                <p className="text-sm text-yellow-600">Warning</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {reportData.security_alerts.by_severity?.info || 0}
                </p>
                <p className="text-sm text-blue-600">Info</p>
              </div>
            </div>

            {reportData.security_alerts.critical_alerts?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-3">Critical Alerts</h4>
                <div className="space-y-2">
                  {reportData.security_alerts.critical_alerts.map((alert, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-gray-800">{alert.description}</p>
                        <span className="text-xs text-gray-500 ml-2">{alert.student_id}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Student Activity */}
        {activeSection === 'students' && reportData.student_activity && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{reportData.student_activity.total_students}</span> students monitored
              </p>
              <p className="text-sm text-red-600">
                <span className="font-semibold">{reportData.student_activity.high_risk_count}</span> high risk
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sessions</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bandwidth</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Apps</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Alerts</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.student_activity.student_summary?.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.student_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">{student.total_sessions}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{student.total_bandwidth_mb} MB</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">{student.unique_applications}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">{student.alert_count}</td>
                      <td className="px-4 py-3 text-center">
                        <RiskBadge level={student.risk_level} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {activeSection === 'recommendations' && reportData.recommendations && (
          <div className="space-y-4">
            {reportData.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high' ? 'bg-red-50 border-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <PriorityBadge priority={rec.priority} />
                  <span className="text-xs font-medium text-gray-500 uppercase">{rec.category}</span>
                </div>
                <h4 className="font-medium text-gray-800">{rec.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyReportTable;
