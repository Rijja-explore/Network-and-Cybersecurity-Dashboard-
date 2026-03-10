import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { scheduleAPI } from '../services/api';

const BlockedSitesNotification = () => {
  const [blockedSites, setBlockedSites] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    const dismissed = sessionStorage.getItem('blockedSitesNotificationDismissed');
    if (!dismissed) {
      checkBlockedSites();
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for this session
    sessionStorage.setItem('blockedSitesNotificationDismissed', 'true');
  };

  const checkBlockedSites = async () => {
    try {
      const response = await scheduleAPI.getActiveBlocks();
      const sites = response.data;
      
      if (sites.length > 0) {
        setBlockedSites(sites);
        setIsVisible(true);
      } else {
        setBlockedSites([]);
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error checking blocked sites:', error);
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-colors animate-pulse"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{blockedSites.length} Site(s) Blocked</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <div className="bg-red-900/95 backdrop-blur-sm border-2 border-red-500 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
            <div>
              <h3 className="text-white font-bold">Websites Blocked</h3>
              <p className="text-red-200 text-xs">Scheduled Restrictions Active</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-red-700 rounded transition-colors"
              title="Minimize"
            >
              <span className="text-white text-xl">−</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-red-700 rounded transition-colors"
              title="Dismiss"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {blockedSites.map((site, index) => (
              <div
                key={index}
                className="bg-red-800/50 border border-red-600/50 rounded-lg p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-white text-lg">{site.website}</p>
                  <div className="flex items-center space-x-1 text-red-200 text-xs bg-red-700/50 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    <span>Until {formatTime(site.end_time)}</span>
                  </div>
                </div>
                
                {site.reason && (
                  <div className="mt-2 pt-2 border-t border-red-600/30">
                    <p className="text-red-100 text-sm">
                      <span className="font-medium">Reason:</span> {site.reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-red-600/30">
            <div className="flex items-center space-x-2 text-red-200 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <p>These websites are currently blocked by your administrator.</p>
            </div>
            <p className="text-red-300 text-xs mt-2">
              Access will be automatically restored after the scheduled time ends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedSitesNotification;
