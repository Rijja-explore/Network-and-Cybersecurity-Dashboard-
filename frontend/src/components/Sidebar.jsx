import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/network-health', icon: '🌐', label: 'Network Health' },
    { path: '/alerts', icon: '🚨', label: 'Security Alerts' },
    { path: '/students', icon: '👥', label: 'Endpoints' },
    { path: '/reports', icon: '📈', label: 'Reports' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-soc-card h-screen fixed left-0 top-0 border-r border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-soc-accent">🛡️ SOC Dashboard</h1>
        <p className="text-xs text-gray-400 mt-1">Security Operations Center</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-soc-accent text-white shadow-lg'
                    : 'text-soc-text hover:bg-gray-700'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          <p>© 2026 SOC Dashboard</p>
          <p className="mt-1">Network Security Monitoring</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
