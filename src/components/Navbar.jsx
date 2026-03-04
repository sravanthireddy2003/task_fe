import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setOpenSidebar } from "../redux/slices/authSlice";
import NotificationPanel from "./NotificationPanel";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "./Button";
import * as Icons from "../icons";

const Navbar = ({ searchQuery, setSearchQuery, onFilterClick, onViewToggle }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const rolePrefix = user?.role?.toLowerCase() || 'admin';

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
    if (path.includes('/module/')) return 'Workspace';
    return 'Task Manager';
  };

  const handleSearch = (e) => {
    setSearchQuery?.(e.target.value);
  };

  // Navigate to Tasks page and open create modal
  const handleCreateTask = () => {
    navigate(`/${rolePrefix}/tasks`, { state: { openCreateModal: true } });
  };

  return (
    <div className="flex justify-between items-center px-6 py-4 shadow-sm border-b border-gray-200 sticky top-0 z-40 bg-white/80 backdrop-blur-md transition-all">
      <div className="flex items-center gap-6">
        {/* Mobile Menu Button */}
        <button
          onClick={() => dispatch(setOpenSidebar(true))}
          className="text-gray-500 block md:hidden hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
        >
          <Icons.Menu className="w-6 h-6" />
        </button>

        {/* Page Title Context */}
        <div className="hidden sm:block">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-0.5 font-medium">
            <span className="capitalize">{user?.role || 'Workspace'}</span>
            <Icons.ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-semibold">{getPageTitle()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">

        {/* Mock Global Search (Command Palette) */}
        <div className="relative hidden lg:block group">
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 opacity-60">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 rounded shadow-sm">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 rounded shadow-sm">K</kbd>
          </div>
        </div>

        {/* Action Separator */}
        <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1"></div>

        {/* Contextual Page Buttons (Filter / View) */}
        {onFilterClick && (
          <Button
            onClick={onFilterClick}
            variant="secondary"
            icon={Icons.Filter}
            label="Filter"
            className="hidden md:inline-flex bg-white hover:bg-gray-50 shadow-sm border-gray-200 py-2 h-[38px]"
          />
        )}

        {onViewToggle && (
          <Button
            onClick={onViewToggle}
            variant="secondary"
            icon={Icons.LayoutPanelLeft}
            label="View"
            className="hidden md:inline-flex bg-white hover:bg-gray-50 shadow-sm border-gray-200 py-2 h-[38px]"
          />
        )}
        {/* Notifications */}
        <div className="ml-1 relative z-50">
          <NotificationPanel />
        </div>
      </div>
    </div>
  );
};

export default Navbar;