/**
 * Alerts Chart Component
 * ======================
 * Displays security alerts data in various chart formats
 * 
 * Uses Recharts for visualization
 * 
 * Props:
 * - chartData: Object from /analytics/charts/alerts endpoint
 * - loading: Boolean for loading state
 */

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AlertsChart = ({ chartData, loading }) => {
  const [activeView, setActiveView] = useState('severity');

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-cyber-card border border-cyber-border rounded-xl shadow-md p-6">
        <div className="h-6 bg-cyber-border rounded w-40 mb-4 animate-pulse"></div>
        <div className="h-80 bg-cyber-darker rounded animate-pulse"></div>
      </div>
    );
  }

  // Empty state
  if (!chartData || !chartData.by_severity?.length) {
    return (
      <div className="bg-cyber-card border border-cyber-border rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-soc-text mb-4">Security Alerts</h3>
        <div className="h-80 flex items-center justify-center bg-cyber-darker rounded-lg">
          <div className="text-center">
            <svg className="w-16 h-16 text-neon-cyan mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400">No alerts detected</p>
          </div>
        </div>
      </div>
    );
  }

  const viewTabs = [
    { id: 'severity', label: 'By Severity' },
    { id: 'type', label: 'By Type' },
    { id: 'trend', label: 'Daily Trend' },
  ];

  // Colors for severity levels
  const SEVERITY_COLORS = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  // Colors for chart elements
  const TYPE_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#ec4899', '#6366f1'];

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200">
          <p className="font-medium capitalize">{data.severity || data.type}</p>
          <p className="text-sm text-gray-600">{data.count} alerts</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomLabel = ({ name, percent }) => {
    return `${name} (${(percent * 100).toFixed(0)}%)`;
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl shadow-md p-6">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-3 sm:mb-0">
          <h3 className="text-lg font-semibold text-soc-text">Security Alerts Analysis</h3>
          <p className="text-sm text-gray-400">Total: {chartData.total_alerts} alerts</p>
        </div>
        <div className="flex space-x-1 bg-cyber-darker rounded-lg p-1">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeView === tab.id
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-soc-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {activeView === 'severity' && (
            <PieChart>
              <Pie
                data={chartData.by_severity}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
                nameKey="severity"
                label={renderCustomLabel}
                labelLine={true}
              >
                {chartData.by_severity.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={SEVERITY_COLORS[entry.severity] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend
                formatter={(value) => <span className="capitalize">{value}</span>}
              />
            </PieChart>
          )}

          {activeView === 'type' && (
            <BarChart data={chartData.by_type} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis
                type="category"
                dataKey="type"
                stroke="#6b7280"
                fontSize={11}
                width={120}
                tickFormatter={(value) => value.replace(/_/g, ' ')}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [value, 'Count']}
                labelFormatter={(label) => label.replace(/_/g, ' ')}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.by_type.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}

          {activeView === 'trend' && (
            <LineChart data={chartData.daily_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [value, 'Alerts']}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
                name="Alert Count"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Recent alerts list */}
      {chartData.recent_alerts && chartData.recent_alerts.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Alerts</h4>
          <div className="space-y-2">
            {chartData.recent_alerts.slice(0, 3).map((alert, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  alert.severity === 'critical' ? 'bg-red-50' :
                  alert.severity === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                  ></span>
                  <span className="text-sm text-gray-700">{alert.description}</span>
                </div>
                <span className="text-xs text-gray-500">{alert.student_id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsChart;
