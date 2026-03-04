import React from 'react';
import * as Icons from '../icons';

const { MessageCircle } = Icons;

export const ChatLoadingScreen = ({ message = 'Loading conversations...' }) => {
  return (
    <div className="flex items-center justify-center h-full bg-[#F8FAFC]">
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center">
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 opacity-50"></div>
          <div className="w-16 h-16 border-4 border-transparent border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin"></div>
          {/* Inner icon */}
          <div className="absolute w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <MessageCircle className="w-5 h-5 text-indigo-500 animate-pulse" />
          </div>
        </div>
        <p className="text-indigo-900/60 font-semibold tracking-wide text-sm mt-6 animate-pulse">{message}</p>
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
    <div className="flex items-center justify-center h-full bg-[#F8FAFC]">
      <div className="text-center max-w-md p-10 bg-white rounded-3xl border border-gray-200 shadow-md mx-4">
        {/* Decorative background element */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-blue-400 rounded-3xl rotate-6 opacity-20 blur-lg animate-pulse"></div>
          <div className="relative w-full h-full bg-gradient-to-tr from-indigo-50 to-blue-50 border border-white shadow-inner rounded-3xl flex items-center justify-center rotate-[-3deg] transition-transform hover:rotate-0 duration-300">
            <MessageCircle className="w-10 h-10 text-indigo-500" />
          </div>
        </div>
        <h3 className="text-page-title bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 mb-3 tracking-tight">{title}</h3>
        <p className="text-gray-500 font-medium mb-4">{description}</p>
        {helperText && (
          <p className="text-gray-400 text-sm mb-6 bg-gray-50 inline-block px-4 py-2 rounded-full font-medium">{helperText}</p>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-2 w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

