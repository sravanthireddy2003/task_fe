import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setOpenSidebar } from "../redux/slices/authSlice";
import UserAvatar from "./UserAvatar";
import NotificationPanel from "./NotificationPanel";
import { useLocation } from "react-router-dom";
import Button from "./Button";
import * as Icons from "../icons";

const Navbar = ({ searchQuery, setSearchQuery, onCreateTask, onFilterClick, onViewToggle }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  // Get current page title from pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/tasks')) return 'Tasks';
    if (path.includes('/projects')) return 'Projects';
    if (path.includes('/clients')) return 'Clients';
    if (path.includes('/users')) return 'Users';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/chat')) return 'Chat';
    return 'Task Manager';
  };

  const handleSearch = (e) => {
    setSearchQuery?.(e.target.value);
  };

  return (
    <div className="flex justify-between items-center bg-white px-6 py-4 shadow-sm border-b border-slate-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
      <div className="flex items-center gap-6">
        {/* Mobile Menu Button */}
        <button
          onClick={() => dispatch(setOpenSidebar(true))}
          className="text-xl text-slate-500 block md:hidden hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
        >
          ☰
        </button>

        {/* Page Title */}
        <div>
          <h1 className="text-heading-3 font-semibold text-gray-900">{getPageTitle()}</h1>
          <p className="text-caption text-gray-500">Manage and track your work efficiently</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        {/* <div className="relative hidden md:block">
          <MdOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search tasks, projects..."
            value={searchQuery || ''}
            onChange={handleSearch}
            className="pl-10 pr-4 py-2.5 w-72 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-body placeholder:text-slate-400 transition-all"
          />
        </div> */}

        {/* Filter Button */}
        {onFilterClick && (
          <Button
            onClick={onFilterClick}
            variant="secondary"
            size="sm"
            icon={Icons.Filter}
            label="Filter"
            className="hidden md:inline-flex"
          />
        )}

        {/* View Toggle */}
        {onViewToggle && (
          <Button
            onClick={onViewToggle}
            variant="secondary"
            size="sm"
            icon={Icons.LayoutPanelLeft}
            label="View"
            className="hidden md:inline-flex"
          />
        )}

        {/* Create Task Button */}
        {/* <button
          onClick={onCreateTask}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-all transform hover:scale-105"
        >
          <MdOutlineAdd size={20} />
          <span className="hidden sm:inline">Create Task</span>
        </button> */}

        {/* Notifications */}
        <NotificationPanel />

        {/* User Profile */}
        <UserAvatar />
      </div>
    </div>
  );
};

export default Navbar;