import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ title }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const username = localStorage.getItem('username') || 'Admin';

  return (
    <nav className="bg-soc-card border-b border-gray-700 px-8 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-soc-text">{title}</h2>
        <p className="text-sm text-gray-400">Real-time monitoring and analysis</p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-soc-accent rounded-full flex items-center justify-center text-white font-bold">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-soc-text font-medium">{username}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-soc-alert hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
