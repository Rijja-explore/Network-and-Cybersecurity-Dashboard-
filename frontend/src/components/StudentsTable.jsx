import React, { useState } from 'react';

const StudentsTable = ({ students, onBlockWebsite, onUnblockWebsite, onBlockAll }) => {
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
    return new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const toggleExpand = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const handleBlock = async (studentId, domain) => {
    if (onBlockWebsite) {
      try { await onBlockWebsite(studentId, domain); }
      catch (e) { console.error('Block error:', e); }
    }
  };

  const handleUnblock = async (studentId, domain) => {
    if (onUnblockWebsite) {
      try { await onUnblockWebsite(studentId, domain); }
      catch (e) { console.error('Unblock error:', e); }
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
                    <div className="flex items-center gap-2">
                      <span>{formatLastSeen(student.lastSeen)}</span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const allSites = [...new Set([
                            ...(student.all_websites || student.websites || []),
                            ...(student.open_tabs || []),
                            ...((student.destinations || []).map(d => d.domain).filter(Boolean)),
                          ])];
                          if (onBlockAll) await onBlockAll(student.hostname, allSites);
                        }}
                        className="px-2 py-1 bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white rounded-full text-xs font-semibold transition-all shadow shrink-0"
                      >🔒 Block All</button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded row — all websites + live connections in ONE block */}
                {expandedRow === index && (() => {
                  const allSites = [...new Set([
                    ...(student.all_websites || student.websites || []),
                    ...(student.open_tabs || []),
                    ...((student.destinations || []).map(d => d.domain).filter(Boolean)),
                  ])];
                  // Build domain → IP map from destinations for display
                  const domainIpMap = {};
                  (student.destinations || []).forEach(d => {
                    if (d.domain && d.ip) domainIpMap[d.domain] = d.ip;
                  });
                  return (
                    <tr className="bg-gray-900/50 border-b border-gray-700">
                      <td colSpan="5" className="px-6 py-4">
                        <h4 className="text-sm font-semibold text-soc-text mb-3">
                          🌐 Websites ({allSites.length})
                          <span className="ml-2 text-xs text-gray-500 font-normal">Click row to collapse</span>
                        </h4>
                        {allSites.length === 0 ? (
                          <p className="text-gray-500 text-sm">No website data available.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1">
                            {allSites.map((site, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-900 rounded-xl px-3 py-2 border border-gray-700 hover:border-gray-500 transition-colors">
                                <div className="flex flex-col flex-1 mr-2 min-w-0">
                                  <span className="text-gray-200 text-sm font-mono truncate">{site}</span>
                                  {domainIpMap[site] && (
                                    <span className="text-gray-500 text-xs font-mono truncate">{domainIpMap[site]}</span>
                                  )}
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleBlock(student.hostname, site); }}
                                    className="px-2.5 py-1 bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white rounded-full text-xs font-semibold transition-all shadow"
                                  >🔒 Block</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleUnblock(student.hostname, site); }}
                                    className="px-2.5 py-1 bg-gradient-to-r from-green-700 to-green-500 hover:from-green-600 hover:to-green-400 text-white rounded-full text-xs font-semibold transition-all shadow"
                                  >🔓 Unblock</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })()}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsTable;
