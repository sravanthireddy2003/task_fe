import React from 'react';
import * as Icons from '../icons';

const { RefreshCw } = Icons;

const RefreshButton = ({ onClick, loading = false, title = 'Refresh', className = '' }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg border ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'} ${className}`}
      disabled={loading}
    >
      <RefreshCw className={`${loading ? 'animate-spin' : ''} w-5 h-5`} />
    </button>
  );
};

export default RefreshButton;
