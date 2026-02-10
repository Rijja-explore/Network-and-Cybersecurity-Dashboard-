import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ title }) => {
  const username = localStorage.getItem('username') || 'Admin';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cyber-card border-b border-cyber-border px-8 py-4 backdrop-blur-xl bg-opacity-95"
    >
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-cyan"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-gray-500 mt-1"
          >
            Real-time monitoring and security analytics
          </motion.p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-cyber-border rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-status-critical rounded-full animate-pulse"></span>
          </motion.button>

          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="p-2 hover:bg-cyber-border rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </motion.button>

          {/* User Profile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 pl-4 border-l border-cyber-border"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-300">{username}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="p-2 bg-gradient-to-br from-neon-blue to-neon-cyan rounded-lg">
              <User className="w-5 h-5 text-cyber-darker" />
            </div>
          </motion.div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-soc-alert hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          Logout
        </button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
