import React, { Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setOpenSidebar, logoutUser, logout } from "../redux/slices/authSlice";
import NotificationPanel from "./NotificationPanel";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Transition } from '@headlessui/react';
import clsx from "clsx";
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

  const handleLogout = async () => {
    try {
      if (logoutUser) {
        await dispatch(logoutUser());
      }
    } catch (e) {
      console.error(e);
    } finally {
      dispatch(logout());
      navigate("/log-in");
    }
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

        {/* Profile Dropdown */}
        <Menu as="div" className="relative ml-2 z-50">
          <Menu.Button className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}
            >
              <span className="text-sm font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-3 w-56 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 overflow-hidden divide-y divide-gray-100">
              <div className="px-4 py-3 bg-gray-50/50">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5 capitalize">{user?.role || "Role"}</p>
              </div>
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/profile')}
                      className={clsx(
                        active ? 'bg-gray-50 text-indigo-600' : 'text-gray-700',
                        'group flex w-full items-center px-4 py-2 text-sm font-medium transition-colors'
                      )}
                    >
                      <Icons.User2 className="mr-3 h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      Profile / Settings
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/change-password')}
                      className={clsx(
                        active ? 'bg-gray-50 text-indigo-600' : 'text-gray-700',
                        'group flex w-full items-center px-4 py-2 text-sm font-medium transition-colors'
                      )}
                    >
                      <Icons.Key className="mr-3 h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      Change Password
                    </button>
                  )}
                </Menu.Item>
              </div>
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={clsx(
                        active ? 'bg-red-50 text-red-700' : 'text-red-600',
                        'group flex w-full items-center px-4 py-2 text-sm font-medium transition-colors'
                      )}
                    >
                      <Icons.LogOut className="mr-3 h-4 w-4 text-red-500 transition-colors" />
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
};

export default Navbar;