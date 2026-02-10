import React, { useState } from 'react';
import BlockButton from './BlockButton';

const StudentsTable = ({ students, onBlock, onBlockWebsite, onUnblockWebsite }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const formatBandwidth = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    const gb = mb / 1024;

    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  const formatLastSeen = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const handleBlockWebsite = async (studentId, domain) => {
    if (onBlockWebsite) {
      await onBlockWebsite(studentId, domain);
    }
  };

  const handleUnblockWebsite = async (studentId, domain) => {
    if (onUnblockWebsite) {
      await onUnblockWebsite(studentId, domain);
    }
  };

  if (!students || students.length === 0) {
    return (
      <div className="bg-soc-card rounded-xl border border-gray-700 p-8 text-center">
        <p className="text-gray-400">No endpoints found</p>
      </div>
    );
  }

  return (
    <div className="bg-soc-card rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Hostname</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Websites</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Running Processes</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Bandwidth Used</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Last Seen</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <React.Fragment key={index}>
                <tr
                  className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(index)}
                >
                  <td className="px-6 py-4 text-soc-text font-medium">{student.hostname}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {student.websites && student.websites.length > 0 ? (
                      <span className="text-sm">
                        {student.websites.slice(0, 2).join(', ')}
                        {student.websites.length > 2 && (
                          <span className="text-soc-accent ml-1">
                            +{student.websites.length - 2} more
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-600">No websites tracked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {Array.isArray(student.processes)
                      ? student.processes.slice(0, 3).join(', ')
                      : student.processes || 'N/A'}
                    {student.processes && student.processes.length > 3 && (
                      <span className="text-gray-600 ml-1">+{student.processes.length - 3}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-soc-text">{formatBandwidth(student.bandwidth)}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {formatLastSeen(student.lastSeen)}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <BlockButton 
                      studentIp={student.ip} 
                      studentName={student.hostname} 
                      onBlock={onBlock} 
                    />
                  </td>
                </tr>
                
                {/* Expanded row showing all websites with block buttons */}
                {expandedRow === index && (
                  <tr className="bg-gray-900/50 border-b border-gray-700">
                    <td colSpan="6" className="px-6 py-4">
                      <div className="space-y-4">
                        {/* Currently Blocked Websites Section */}
                        {student.blocked_domains && student.blocked_domains.length > 0 && (
                          <>
                            <h4 className="text-sm font-semibold text-soc-alert mb-2 flex items-center">
                              🚫 Currently Blocked ({student.blocked_domains.length}):
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                              {student.blocked_domains.map((domain, idx) => (
                                <div
                                  key={`blocked-${idx}`}
                                  className="flex items-center justify-between bg-red-900/30 border border-red-700 rounded-lg px-3 py-2"
                                >
                                  <span className="text-red-300 text-sm font-mono truncate flex-1">
                                    {domain}
                                  </span>
                                  <button
                                    onClick={() => handleUnblockWebsite(student.hostname, domain)}
                                    className="ml-2 px-3 py-1 bg-soc-success hover:bg-green-600 text-white rounded text-xs font-medium transition-colors"
                                    title="Unblock this website"
                                  >
                                    Unblock
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Websites Accessed Section */}
                        {student.websites && student.websites.length > 0 && (
                          <>
                            <h4 className="text-sm font-semibold text-soc-text mb-2">
                              🌐 Websites Accessed:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {student.websites.map((website, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 border border-gray-700"
                                >
                                  <span className="text-gray-300 text-sm font-mono truncate flex-1">
                                    {website}
                                  </span>
                                  <div className="flex space-x-1 ml-2">
                                    <button
                                      onClick={() => handleBlockWebsite(student.hostname, website)}
                                      className="px-3 py-1 bg-soc-alert hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                                      title="Block this website"
                                    >
                                      Block
                                    </button>
                                    <button
                                      onClick={() => handleUnblockWebsite(student.hostname, website)}
                                      className="px-3 py-1 bg-soc-success hover:bg-green-600 text-white rounded text-xs font-medium transition-colors"
                                      title="Unblock this website"
                                    >
                                      Unblock
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Show destinations if available */}
                        {student.destinations && student.destinations.length > 0 && (
                          <>
                            <h4 className="text-sm font-semibold text-soc-text mt-4 mb-2">
                              📡 Network Connections:
                            </h4>
                            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 max-h-48 overflow-y-auto">
                              <table className="w-full text-xs">
                                <thead className="text-gray-400 border-b border-gray-700">
                                  <tr>
                                    <th className="text-left pb-2">Domain/IP</th>
                                    <th className="text-left pb-2">Port</th>
                                  </tr>
                                </thead>
                                <tbody className="text-gray-300 font-mono">
                                  {student.destinations.map((dest, dIdx) => (
                                    <tr key={dIdx} className="border-b border-gray-700/50">
                                      <td className="py-1">{dest.domain || dest.ip}</td>
                                      <td className="py-1">{dest.port}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsTable;
