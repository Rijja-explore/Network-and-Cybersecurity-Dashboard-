import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const RefreshTimer = ({ seconds, onRefresh }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-400 text-sm">
        Refreshing in <span className="font-bold text-neon-blue">{seconds}s</span>
      </div>
      <motion.button
        onClick={onRefresh}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-cyan text-cyber-darker rounded-lg transition-all duration-200 font-medium flex items-center gap-2 shadow-neon-blue hover:shadow-neon-cyan"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-4 h-4" />
        </motion.div>
        <span>Refresh Now</span>
      </motion.button>
    </div>
  );
};

export default RefreshTimer;
