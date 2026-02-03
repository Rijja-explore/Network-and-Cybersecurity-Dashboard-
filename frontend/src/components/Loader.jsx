import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-soc-accent border-t-transparent rounded-full animate-spin"></div>
        <div className="mt-4 text-soc-text text-sm text-center">Loading...</div>
      </div>
    </div>
  );
};

export default Loader;
