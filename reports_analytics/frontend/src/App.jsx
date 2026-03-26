/**
 * Main App Entry Point
 * ====================
 * Sets up React Router and main app structure
 * 
 * INTEGRATION NOTES:
 * - Add authentication wrapper when connecting to main system
 * - Add global state management (Redux/Context) if needed
 * - Add navigation sidebar when integrating with main dashboard
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnalyticsDashboard, ReportsPage } from './pages';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main analytics dashboard */}
        <Route path="/" element={<AnalyticsDashboard />} />
        
        {/* Reports page */}
        <Route path="/reports" element={<ReportsPage />} />
        
        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
