import React from 'react';
import * as Icons from '../icons';

const { MessageCircle } = Icons;

export const ChatLoadingScreen = ({ message = 'Loading conversations...' }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
          <MessageCircle className="w-5 h-5 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-600 text-sm mt-3">{message}</p>
      </div>
    </div>
  );
};

export const ChatEmptyState = ({
  title = 'No projects found',
  description = 'Create a project to start team collaboration',
  helperText,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center max-w-sm p-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
          <MessageCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-2">{description}</p>
        {helperText && (
          <p className="text-gray-400 text-xs">{helperText}</p>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
