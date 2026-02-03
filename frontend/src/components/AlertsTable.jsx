import React from 'react';

const AlertsTable = ({ alerts }) => {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'text-soc-alert bg-red-500/10 border-red-500/50';
      case 'warning':
        return 'text-soc-warning bg-yellow-500/10 border-yellow-500/50';
      case 'info':
        return 'text-soc-accent bg-blue-500/10 border-blue-500/50';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/50';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-soc-card rounded-xl border border-gray-700 p-8 text-center">
        <p className="text-gray-400">No alerts found</p>
      </div>
    );
  }

  return (
    <div className="bg-soc-card rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Severity</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Hostname</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Alert Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Process</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, index) => (
              <tr
                key={index}
                className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(
                      alert.severity
                    )}`}
                  >
                    {alert.severity || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 text-soc-text font-medium">{alert.hostname}</td>
                <td className="px-6 py-4 text-soc-text">{alert.alertType || alert.type}</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-sm">{alert.process}</td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {formatTimestamp(alert.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsTable;
