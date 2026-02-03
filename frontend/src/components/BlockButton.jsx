import React, { useState } from 'react';

const BlockButton = ({ studentIp, studentName, onBlock }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlockClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setIsBlocking(true);
    try {
      await onBlock(studentIp);
      setShowConfirm(false);
    } catch (error) {
      console.error('Block failed:', error);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <button
        onClick={handleBlockClick}
        disabled={isBlocking}
        className="px-4 py-2 bg-soc-alert hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isBlocking ? 'Blocking...' : 'Block'}
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-soc-card border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-soc-text mb-4">Confirm Block Action</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to block this endpoint?
            </p>
            <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
              <p className="text-soc-text">
                <span className="font-semibold">Hostname:</span> {studentName}
              </p>
              <p className="text-soc-text mt-2">
                <span className="font-semibold">IP Address:</span> {studentIp}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isBlocking}
                className="flex-1 px-4 py-2 bg-soc-alert hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
              >
                {isBlocking ? 'Blocking...' : 'Confirm Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlockButton;
