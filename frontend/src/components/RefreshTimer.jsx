import React from 'react';

const RefreshTimer = ({ seconds, onRefresh }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="text-gray-400 text-sm">
        Refreshing in <span className="font-bold text-soc-accent">{seconds}s</span>
      </div>
      <button
        onClick={onRefresh}
        className="px-4 py-2 bg-soc-accent hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
      >
        <span>🔄</span>
        <span>Refresh Now</span>
      </button>
    </div>
  );
};

export default RefreshTimer;
