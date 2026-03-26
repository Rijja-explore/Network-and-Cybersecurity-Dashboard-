import React, { useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  Download,
  FileText,
  RefreshCw,
  Server,
  ShieldAlert,
  Wifi,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { fetchLogs, getActiveAlerts, getWeeklyStats } from '../services/api';

const ALERT_COLORS = {
  critical: '#ff4d6d',
  high: '#ff7a45',
  medium: '#ffc53d',
  warning: '#ffd666',
  low: '#40a9ff',
  info: '#69c0ff',
};

const numberOrZero = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const formatDateTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const escapeCsv = (value) => {
  const text = String(value ?? '');
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
};

const downloadTextFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const [weeklyStats, activeAlerts, activityLogs] = await Promise.all([
        getWeeklyStats(),
        getActiveAlerts(),
        fetchLogs(),
      ]);

      setStats(weeklyStats);
      setAlerts(Array.isArray(activeAlerts) ? activeAlerts : []);
      setLogs(Array.isArray(activityLogs) ? activityLogs : []);
      setLastUpdated(new Date());
    } catch (loadError) {
      console.error('Failed to load dynamic report data:', loadError);
      setError('Failed to load report data. Please make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const derived = useMemo(() => {
    const topBandwidthHosts = Array.isArray(stats?.top_bandwidth_hosts) ? stats.top_bandwidth_hosts : [];
    const alertsBySeverity = stats?.alerts_by_severity || {};

    const bandwidthData = topBandwidthHosts.slice(0, 8).map((host) => ({
      name: host.hostname,
      bandwidthGb: Number((numberOrZero(host.total_bandwidth) / (1024 ** 3)).toFixed(3)),
    }));

    const severityData = Object.entries(alertsBySeverity)
      .filter(([, value]) => numberOrZero(value) > 0)
      .map(([severity, value]) => ({
        severity,
        count: numberOrZero(value),
        color: ALERT_COLORS[severity] || '#91d5ff',
      }));

    const cpuTrend = logs.slice(0, 15).reverse().map((item) => ({
      time: formatDateTime(item.raw_timestamp || item.timestamp).split(', ')[1] || 'N/A',
      cpu: numberOrZero(item.cpu),
      memory: numberOrZero(item.memory),
    }));

    const recentAlerts = alerts.slice(0, 15);

    return {
      bandwidthData,
      severityData,
      cpuTrend,
      recentAlerts,
    };
  }, [stats, alerts, logs]);

  const handleDownloadCsv = () => {
    if (!stats) {
      alert('No report data available for export.');
      return;
    }

    setExportingCsv(true);
    try {
      const lines = [];
      lines.push('Section,Field,Value');
      lines.push([
        escapeCsv('Summary'),
        escapeCsv('Generated At'),
        escapeCsv(lastUpdated ? formatDateTime(lastUpdated) : 'N/A'),
      ].join(','));
      lines.push([
        escapeCsv('Summary'),
        escapeCsv('Active Endpoints'),
        escapeCsv(numberOrZero(stats.active_students)),
      ].join(','));
      lines.push([
        escapeCsv('Summary'),
        escapeCsv('Total Alerts'),
        escapeCsv(numberOrZero(stats.alert_count)),
      ].join(','));
      lines.push([
        escapeCsv('Summary'),
        escapeCsv('Total Bandwidth (GB)'),
        escapeCsv(numberOrZero(stats.total_bandwidth_gb).toFixed(3)),
      ].join(','));

      lines.push('');
      lines.push('Top Bandwidth Hosts');
      lines.push('Hostname,Total Sent,Total Received,Total Bandwidth');
      (stats.top_bandwidth_hosts || []).forEach((host) => {
        lines.push([
          escapeCsv(host.hostname),
          escapeCsv(numberOrZero(host.total_sent)),
          escapeCsv(numberOrZero(host.total_recv)),
          escapeCsv(numberOrZero(host.total_bandwidth)),
        ].join(','));
      });

      lines.push('');
      lines.push('Alerts By Severity');
      lines.push('Severity,Count');
      Object.entries(stats.alerts_by_severity || {}).forEach(([severity, count]) => {
        lines.push([escapeCsv(severity), escapeCsv(numberOrZero(count))].join(','));
      });

      lines.push('');
      lines.push('Recent Active Alerts');
      lines.push('ID,Hostname,Severity,Reason,Timestamp,Status');
      derived.recentAlerts.forEach((alert) => {
        lines.push([
          escapeCsv(alert.id),
          escapeCsv(alert.hostname),
          escapeCsv(alert.severity),
          escapeCsv(alert.reason),
          escapeCsv(formatDateTime(alert.timestamp)),
          escapeCsv(alert.status || 'active'),
        ].join(','));
      });

      lines.push('');
      lines.push('Resource Trend');
      lines.push('Time,CPU %,Memory %');
      derived.cpuTrend.forEach((entry) => {
        lines.push([
          escapeCsv(entry.time),
          escapeCsv(entry.cpu),
          escapeCsv(entry.memory),
        ].join(','));
      });

      const content = lines.join('\n');
      downloadTextFile(
        `dynamic_security_report_${Date.now()}.csv`,
        content,
        'text/csv;charset=utf-8;'
      );
    } catch (csvError) {
      console.error('CSV export failed:', csvError);
      alert('Failed to generate CSV. Please try again.');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleDownloadPdf = async () => {
    const exportRoot = document.getElementById('reports-export-content');
    if (!exportRoot) {
      alert('Report content is not ready for PDF export.');
      return;
    }

    setExportingPdf(true);
    try {
      const canvas = await html2canvas(exportRoot, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      const printablePageHeight = pageHeight - margin * 2;

      let remainingHeight = contentHeight;
      let yOffset = margin;

      pdf.addImage(imgData, 'PNG', margin, yOffset, contentWidth, contentHeight);
      remainingHeight -= printablePageHeight;

      while (remainingHeight > 0) {
        pdf.addPage();
        yOffset = margin - (contentHeight - remainingHeight);
        pdf.addImage(imgData, 'PNG', margin, yOffset, contentWidth, contentHeight);
        remainingHeight -= printablePageHeight;
      }

      pdf.save(`dynamic_security_report_${Date.now()}.pdf`);
    } catch (pdfError) {
      console.error('PDF export failed:', pdfError);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="flex-1 ml-64 bg-cyber-dark min-h-screen">
      <Navbar title="Reports" />

      <div className="p-8">
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-soc-text mb-2">Dynamic Security Report</h3>
            <p className="text-sm text-gray-400">
              Live report from dashboard data with exportable charts and tables.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated ? formatDateTime(lastUpdated) : 'N/A'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadReport}
              disabled={loading}
              className="px-4 py-2 bg-cyber-card hover:bg-gray-700 border border-cyber-border text-soc-text rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              disabled={loading || exportingCsv || !stats}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{exportingCsv ? 'Preparing CSV...' : 'Export CSV'}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={loading || exportingPdf || !stats}
              className="px-4 py-2 bg-neon-blue hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{exportingPdf ? 'Preparing PDF...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-400">Report Load Error</h3>
                <p className="text-sm text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div id="reports-export-content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Active Endpoints</span>
                <Server className="w-5 h-5 text-neon-blue" />
              </div>
              <p className="text-3xl font-bold text-neon-blue mt-3">{numberOrZero(stats?.active_students)}</p>
            </div>

            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Security Alerts</span>
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-3xl font-bold text-red-400 mt-3">{numberOrZero(stats?.alert_count)}</p>
            </div>

            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Bandwidth</span>
                <Wifi className="w-5 h-5 text-neon-cyan" />
              </div>
              <p className="text-3xl font-bold text-neon-cyan mt-3">
                {numberOrZero(stats?.total_bandwidth_gb).toFixed(2)} GB
              </p>
            </div>

            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Report Sessions</span>
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-400 mt-3">{logs.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
              <h4 className="text-base font-semibold text-soc-text mb-4">Top Bandwidth Consumers</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={derived.bandwidthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="bandwidthGb" fill="#00d4ff" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
              <h4 className="text-base font-semibold text-soc-text mb-4">Alerts By Severity</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={derived.severityData}
                      dataKey="count"
                      nameKey="severity"
                      innerRadius={55}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      {derived.severityData.map((entry) => (
                        <Cell key={entry.severity} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
            <h4 className="text-base font-semibold text-soc-text mb-4">CPU and Memory Trend (Latest Activity)</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={derived.cpuTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="cpu" stroke="#22c55e" strokeWidth={2.5} dot={false} name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#38bdf8" strokeWidth={2.5} dot={false} name="Memory %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
            <h4 className="text-base font-semibold text-soc-text mb-4">Recent Active Alerts</h4>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="text-left border-b border-cyber-border text-gray-400">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Host</th>
                    <th className="py-2 pr-4">Severity</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {derived.recentAlerts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">No active alerts found.</td>
                    </tr>
                  )}
                  {derived.recentAlerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-cyber-border/60 text-gray-300">
                      <td className="py-3 pr-4">{alert.id}</td>
                      <td className="py-3 pr-4">{alert.hostname}</td>
                      <td className="py-3 pr-4">
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            color: '#e2e8f0',
                            backgroundColor: `${ALERT_COLORS[alert.severity] || '#64748b'}33`,
                          }}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{alert.reason}</td>
                      <td className="py-3">{formatDateTime(alert.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
