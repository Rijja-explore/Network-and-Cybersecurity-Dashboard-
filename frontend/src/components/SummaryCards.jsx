/**
 * Summary Cards Component
 * =======================
 * Displays key metrics in card format for the dashboard header
 * 
 * Props:
 * - summaryData: Object containing analytics summary
 * - loading: Boolean for loading state
 */

import React from 'react';

// Icon components (simple SVG icons)
const AlertIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const NetworkIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const AppIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const SummaryCards = ({ summaryData, loading }) => {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-cyber-card border border-cyber-border rounded-xl shadow-md p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-cyber-border rounded w-24"></div>
                <div className="h-8 bg-cyber-border rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-cyber-border rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!summaryData) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-xl p-6 mb-8">
        <p className="text-yellow-400">No summary data available. Check API connection.</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Alerts',
      value: summaryData.total_alerts || 0,
      icon: <AlertIcon />,
      bgColor: 'bg-red-900/20',
      iconColor: 'text-red-500',
      subtitle: `${summaryData.alerts_by_severity?.critical || 0} critical`,
    },
    {
      title: 'Active Users',
      value: summaryData.active_users || 0,
      icon: <UsersIcon />,
      bgColor: 'bg-blue-900/20',
      iconColor: 'text-neon-blue',
      subtitle: 'This period',
    },
    {
      title: 'Total Bandwidth',
      value: `${(summaryData.total_bandwidth_mb / 1024).toFixed(2)} GB`,
      icon: <NetworkIcon />,
      bgColor: 'bg-green-900/20',
      iconColor: 'text-neon-cyan',
      subtitle: `Avg: ${summaryData.avg_bandwidth_mb?.toFixed(1)} MB/session`,
    },
    {
      title: 'Top Application',
      value: summaryData.top_applications?.[0]?.name || 'N/A',
      icon: <AppIcon />,
      bgColor: 'bg-purple-900/20',
      iconColor: 'text-neon-purple',
      subtitle: `${summaryData.top_applications?.[0]?.usage || 0} sessions`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-cyber-card border border-cyber-border rounded-xl shadow-md hover:shadow-neon-blue transition-all p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                {card.title}
              </p>
              <p className="mt-2 text-3xl font-bold text-soc-text">{card.value}</p>
              <p className="mt-1 text-sm text-gray-400">{card.subtitle}</p>
            </div>
            <div className={`p-3 rounded-full ${card.bgColor} ${card.iconColor}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
