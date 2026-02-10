import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', trend, delay = 0 }) => {
  const colorMap = {
    blue: {
      gradient: 'from-neon-blue to-blue-600',
      shadow: 'shadow-neon-blue',
      text: 'text-neon-blue',
      bg: 'bg-neon-blue/10',
      border: 'border-neon-blue/30',
    },
    red: {
      gradient: 'from-status-critical to-red-600',
      shadow: 'shadow-neon-red',
      text: 'text-status-critical',
      bg: 'bg-status-critical/10',
      border: 'border-status-critical/30',
    },
    yellow: {
      gradient: 'from-status-warning to-yellow-600',
      shadow: 'shadow-[0_0_20px_rgba(255,165,2,0.5)]',
      text: 'text-status-warning',
      bg: 'bg-status-warning/10',
      border: 'border-status-warning/30',
    },
    green: {
      gradient: 'from-status-success to-green-600',
      shadow: 'shadow-neon-green',
      text: 'text-status-success',
      bg: 'bg-status-success/10',
      border: 'border-status-success/30',
    },
    purple: {
      gradient: 'from-neon-purple to-purple-600',
      shadow: 'shadow-neon-purple',
      text: 'text-neon-purple',
      bg: 'bg-neon-purple/10',
      border: 'border-neon-purple/30',
    },
    cyan: {
      gradient: 'from-neon-cyan to-cyan-600',
      shadow: 'shadow-neon-cyan',
      text: 'text-neon-cyan',
      bg: 'bg-neon-cyan/10',
      border: 'border-neon-cyan/30',
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`bg-cyber-card border ${colors.border} rounded-xl p-6 ${colors.shadow} hover:${colors.shadow} transition-all duration-300 relative overflow-hidden group`}
    >
      {/* Background gradient effect */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-10 rounded-full filter blur-2xl group-hover:opacity-20 transition-opacity`}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
            {Icon && <Icon className={`w-6 h-6 ${colors.text}`} strokeWidth={2} />}
          </div>
          
          {trend && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.2 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                trend.positive ? 'bg-status-success/10 text-status-success' : 'bg-status-critical/10 text-status-critical'
              }`}
            >
              {trend.positive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold">{trend.value}</span>
            </motion.div>
          )}
        </div>

        <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
        
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.1, type: 'spring', stiffness: 200 }}
          className={`text-3xl font-bold ${colors.text}`}
        >
          {value}
        </motion.div>
      </div>

      {/* Animated border */}
      <motion.div
        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${colors.gradient}`}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ delay: delay + 0.3, duration: 0.6 }}
      />
    </motion.div>
  );
};

export default StatCard;
