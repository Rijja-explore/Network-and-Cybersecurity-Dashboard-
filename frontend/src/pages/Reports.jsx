import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { generateReport } from '../services/api';

const Reports = () => {
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const blob = await generateReport();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SOC_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      alert('Report generated and downloaded successfully!');
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const currentDate = new Date();
  const weekStart = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
  const weekEnd = new Date(currentDate.setDate(currentDate.getDate() + 6));

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex-1 ml-64">
      <Navbar title="Reports" />

      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-soc-text mb-2">Weekly Security Reports</h3>
          <p className="text-sm text-gray-400">
            Generate comprehensive reports for network monitoring and security analysis
          </p>
        </div>

        {/* Report Generator Card */}
        <div className="bg-soc-card border border-gray-700 rounded-xl p-8 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-soc-text mb-2">Weekly Summary Report</h4>
              <p className="text-gray-400 mb-4">
                Period: {formatDate(weekStart)} - {formatDate(weekEnd)}
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ Network health metrics</p>
                <p>✓ Security alerts summary</p>
                <p>✓ Bandwidth usage analysis</p>
                <p>✓ Endpoint activity logs</p>
                <p>✓ Blocked connections report</p>
              </div>
            </div>
            <div>
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="px-8 py-4 bg-soc-accent hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
              >
                <span className="text-2xl">📊</span>
                <span>{generating ? 'Generating...' : 'Generate Report'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Report Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Reports Generated This Month</p>
            <p className="text-3xl font-bold text-soc-text">4</p>
          </div>
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Last Report Generated</p>
            <p className="text-3xl font-bold text-soc-accent">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
            <p className="text-gray-400 mb-2">Report Format</p>
            <p className="text-3xl font-bold text-soc-success">PDF</p>
          </div>
        </div>

        {/* Report History */}
        <div className="bg-soc-card border border-gray-700 rounded-xl p-6">
          <h4 className="text-xl font-bold text-soc-text mb-4">Recent Reports</h4>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item, index) => {
              const reportDate = new Date();
              reportDate.setDate(reportDate.getDate() - (index * 7));
              return (
                <div
                  key={item}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-soc-accent/20 rounded-lg flex items-center justify-center text-2xl">
                      📄
                    </div>
                    <div>
                      <p className="text-soc-text font-medium">
                        Weekly Report - Week {index + 1}
                      </p>
                      <p className="text-sm text-gray-400">
                        Generated on {formatDate(reportDate)}
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium">
                    Download
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
