import React from 'react';

const StatCard = ({ title, value, icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-soc-accent bg-blue-500/10 border-blue-500/30',
    green: 'text-soc-success bg-green-500/10 border-green-500/30',
    yellow: 'text-soc-warning bg-yellow-500/10 border-yellow-500/30',
    red: 'text-soc-alert bg-red-500/10 border-red-500/30',
  };

  return (
    <div className="bg-soc-card border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-soc-text mb-2">{value}</p>
          {trend && (
            <p className={`text-sm ${trend.positive ? 'text-soc-success' : 'text-soc-alert'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl border ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
