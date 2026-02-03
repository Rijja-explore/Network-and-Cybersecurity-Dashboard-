import React from 'react';
import BlockButton from './BlockButton';

const StudentsTable = ({ students, onBlock }) => {
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">IP Address</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Running Processes</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Bandwidth Used</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Last Seen</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-soc-text">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr
                key={index}
                className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4 text-soc-text font-medium">{student.hostname}</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-sm">{student.ip}</td>
                <td className="px-6 py-4 text-gray-400">
                  {Array.isArray(student.processes)
                    ? student.processes.join(', ')
                    : student.processes || 'N/A'}
                </td>
                <td className="px-6 py-4 text-soc-text">{formatBandwidth(student.bandwidth)}</td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {formatLastSeen(student.lastSeen)}
                </td>
                <td className="px-6 py-4">
                  <BlockButton studentIp={student.ip} studentName={student.hostname} onBlock={onBlock} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsTable;
