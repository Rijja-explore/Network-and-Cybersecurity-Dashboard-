import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import { loginAdmin } from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginAdmin(username, password);
      localStorage.setItem('token', response.token || 'mock-token');
      localStorage.setItem('username', username);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials. Use username: admin, password: admin123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue rounded-full filter blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple rounded-full filter blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Logo & Title */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
            className="inline-block mb-4"
          >
            <Shield className="w-20 h-20 text-neon-blue mx-auto drop-shadow-[0_0_15px_rgba(0,212,255,0.8)]" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-blue bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] mb-2">
            CyberSOC Dashboard
          </h1>
          <p className="text-gray-400">Secure Network Operations Center</p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-cyber-card border border-cyber-border rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          {/* Scan line effect */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-neon-blue to-transparent animate-scan"></div>
          
          <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
            <Lock className="w-6 h-6 text-neon-blue" />
            Admin Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-blue" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-cyber-darker border border-cyber-border rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition-all placeholder-gray-600"
                  placeholder="Enter username"
                  required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-blue" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-cyber-darker border border-cyber-border rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition-all placeholder-gray-600"
                  placeholder="Enter password"
                  required
                />
              </div>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-status-critical/10 border border-status-critical/50 rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 text-status-critical flex-shrink-0 mt-0.5" />
                <p className="text-status-critical text-sm">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 py-3 bg-gradient-to-r from-neon-blue to-neon-cyan text-cyber-darker rounded-lg transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-neon-blue hover:shadow-neon-cyan relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-blue opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-cyber-darker border-t-transparent rounded-full animate-spin"></div>
                    Authenticating...
                  </span>
                ) : (
                  'Access System'
                )}
              </span>
            </motion.button>
          </form>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center text-sm text-gray-500"
          >
            <p>Protected by military-grade encryption</p>
          </motion.div>
        </motion.div>

        {/* Bottom text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-xs text-gray-600"
        >
          <p>Department Network Monitoring System</p>
          <p className="mt-1 text-gray-700">Authorized Personnel Only</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
