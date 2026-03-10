/**
 * Network Usage Chart Component
 * =============================
 * Displays network bandwidth usage in multiple chart formats
 * 
 * Uses Recharts for visualization
 * 
 * Props:
 * - chartData: Object from /analytics/charts/network endpoint
 * - loading: Boolean for loading state
 */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const NetworkUsageChart = ({ chartData, loading }) => {
  const [activeChart, setActiveChart] = useState('timeSeries');

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-cyber-card border border-cyber-border rounded-xl shadow-md p-6">
        <div className="h-6 bg-cyber-border rounded w-48 mb-4 animate-pulse"></div>
        <div className="h-80 bg-cyber-darker rounded animate-pulse"></div>
      </div>
    );
  }

  // Empty state
  if (!chartData || !chartData.time_series?.length) {
    return (
      <div className="bg-cyber-card border border-cyber-border rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-soc-text mb-4">Network Usage</h3>
        <div className="h-80 flex items-center justify-center bg-cyber-darker rounded-lg">
          <p className="text-gray-400">No network data available</p>
        </div>
      </div>
    );
  }

  const chartTabs = [
    { id: 'timeSeries', label: 'Timeline' },
    { id: 'perStudent', label: 'By Student' },
    { id: 'hourly', label: 'Hourly Pattern' },
  ];

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl shadow-md p-6">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-semibold text-soc-text mb-3 sm:mb-0">
          Network Usage Analytics
        </h3>
        <div className="flex space-x-1 bg-cyber-darker rounded-lg p-1">
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeChart === tab.id
                  ? 'bg-neon-blue text-white shadow-md'
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
          {activeChart === 'timeSeries' && (
            <LineChart data={chartData.time_series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value} MB`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`${value.toFixed(2)} MB`, 'Bandwidth']}
                labelFormatter={(label) => `Time: ${formatTimestamp(label)}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="bandwidth"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Bandwidth (MB)"
              />
            </LineChart>
          )}

          {activeChart === 'perStudent' && (
            <BarChart data={chartData.per_student}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="student_id" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value} MB`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`${value.toFixed(2)} MB`, 'Total Bandwidth']}
              />
              <Legend />
              <Bar
                dataKey="total_bandwidth"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="Total Bandwidth (MB)"
              />
            </BarChart>
          )}

          {activeChart === 'hourly' && (
            <AreaChart data={chartData.hourly_pattern}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value} MB`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`${value.toFixed(2)} MB`, 'Bandwidth']}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="bandwidth"
                stroke="#8b5cf6"
                fill="#c4b5fd"
                fillOpacity={0.6}
                name="Bandwidth (MB)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart info */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          {activeChart === 'timeSeries' && 'Shows bandwidth usage over time for all sessions'}
          {activeChart === 'perStudent' && 'Total bandwidth consumption per student'}
          {activeChart === 'hourly' && 'Network usage patterns by hour of day'}
        </p>
      </div>
    </div>
  );
};

export default NetworkUsageChart;
