import React, { useState } from 'react';
import * as Icons from '../icons';
import RefreshButton from './RefreshButton';
import { getInitials } from '../utils';

const { MessageCircle, ChevronDown, Search, Settings } = Icons;

const ChatPageLayout = ({
  title = 'Team Chat',
  projects,
  selectedProjectId,
  onSelectProject,
  onRefresh = () => { },
  user,
  children,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-page-title text-gray-900 tracking-tight">{title}</h1>
            <p className="text-small-text font-medium text-gray-500">Collaborate with your team</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input !w-64 pl-10"
            />
          </div>

          <div className="w-px h-6 bg-gray-200 hidden sm:block mx-1"></div>

          {/* Project Selector */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => onSelectProject(e.target.value)}
              className="input !w-auto !min-w-[160px] !max-w-[200px] pl-8 pr-10 border-gray-200 hover:border-indigo-300 focus:ring-indigo-500/10 focus:border-indigo-300 appearance-none bg-white cursor-pointer truncate transition-all duration-200 shadow-sm"
            >
              {projects.map((project) => (
                <option key={project._id || project.id} value={project._id || project.id}>
                  {project.name || project.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-indigo-500 pointer-events-none transition-colors" />
          </div>

          {/* User Avatar + Actions */}
          <div className="flex items-center gap-3 ml-2">
            <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-0.5 transition-colors">
              <RefreshButton onClick={onRefresh} loading={false} className="p-2 hover:bg-transparent" />
            </div>
            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-500/20 ring-2 ring-white cursor-pointer hover:scale-105 transition-transform">
              {getInitials(user?.name || 'User')}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden bg-transparent relative z-10 w-full max-w-[1600px] mx-auto">
        <div className="h-full w-full bg-white md:rounded-t-3xl md:border-x md:border-t border-gray-200/60 shadow-sm flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChatPageLayout;

