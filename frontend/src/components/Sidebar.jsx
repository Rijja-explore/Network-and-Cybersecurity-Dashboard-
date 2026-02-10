import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Activity, 
  AlertTriangle, 
  Users, 
  FileText,
  Shield,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/network-health', icon: Activity, label: 'Network Health' },
    { path: '/alerts', icon: AlertTriangle, label: 'Security Alerts' },
    { path: '/students', icon: Users, label: 'Endpoints' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <motion.aside 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="w-64 bg-cyber-card h-screen fixed left-0 top-0 border-r border-cyber-border flex flex-col backdrop-blur-xl bg-opacity-95"
    >
      {/* Logo */}
      <div className="p-6 border-b border-cyber-border">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <Shield className="w-8 h-8 text-neon-blue" strokeWidth={2} />
          <div>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-cyan">
              CyberSOC
            </h1>
            <p className="text-xs text-gray-500">Security Operations</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <motion.li 
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                    active
                      ? 'bg-gradient-to-r from-neon-blue to-neon-cyan text-cyber-darker shadow-neon-blue'
                      : 'text-gray-400 hover:text-neon-blue hover:bg-cyber-border'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-cyan"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon 
                    className={`w-5 h-5 relative z-10 ${active ? 'text-cyber-darker' : 'text-neon-blue'}`} 
                    strokeWidth={2}
                  />
                  <span className={`font-medium relative z-10 ${active ? 'text-cyber-darker' : ''}`}>
                    {item.label}
                  </span>
                  {!active && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-cyber-border">
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-neon-red hover:bg-cyber-border transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          <span className="font-medium">Logout</span>
        </motion.button>
        
        <div className="mt-4 text-xs text-gray-600 text-center">
          <p>© 2026 CyberSOC</p>
          <p className="mt-1 text-neon-blue/50">Network Security Monitor</p>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
