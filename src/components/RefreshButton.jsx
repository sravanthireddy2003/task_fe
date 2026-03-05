import React from 'react';
import * as Icons from '../icons';

const { RefreshCw } = Icons;

const RefreshButton = ({ onClick, loading = false, disabled = false, title = 'Refresh', className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg border ${(loading || disabled) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'} ${className}`}
      disabled={loading || disabled}
    >
      <RefreshCw className={`${loading ? 'animate-spin' : ''} w-5 h-5`} />
    </button>
  );
};

export default RefreshButton;
