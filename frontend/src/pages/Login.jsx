import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      // Try to login via API
      const response = await loginAdmin(username, password);
      localStorage.setItem('token', response.token || 'mock-token');
      localStorage.setItem('username', username);
      navigate('/dashboard');
    } catch (err) {
      // Fallback: Allow hardcoded credentials if API fails
      if (username === 'admin' && password === 'password') {
        localStorage.setItem('token', 'mock-token-admin');
        localStorage.setItem('username', username);
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Use username: admin, password: password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soc-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-3xl font-bold text-soc-accent mb-2">SOC Dashboard</h1>
          <p className="text-gray-400">Security Operations Center</p>
        </div>

        {/* Login Card */}
        <div className="bg-soc-card border border-gray-700 rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-soc-text mb-6">Admin Login</h2>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-soc-text focus:outline-none focus:ring-2 focus:ring-soc-accent focus:border-transparent transition-all"
                placeholder="Enter username"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-soc-text focus:outline-none focus:ring-2 focus:ring-soc-accent focus:border-transparent transition-all"
                placeholder="Enter password"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-soc-alert text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-soc-accent hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Default Credentials Info */}
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-gray-400 text-center">
              Default credentials: <span className="text-soc-accent font-medium">admin / password</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>© 2026 Department Network Monitoring System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
