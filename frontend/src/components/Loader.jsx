import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: {
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: {
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          className="mb-4 inline-block"
        >
          <Shield className="w-16 h-16 text-neon-blue drop-shadow-[0_0_15px_rgba(0,212,255,0.8)]" strokeWidth={2} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Loading Data</h3>
          <p className="text-sm text-gray-500">Securing connection...</p>
        </motion.div>

        {/* Loading bar */}
        <div className="mt-4 w-64 h-1 bg-cyber-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-blue to-neon-cyan"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Scanning dots */}
        <div className="mt-6 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-neon-blue rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loader;
