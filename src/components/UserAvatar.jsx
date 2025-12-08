import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, selectUser } from "../redux/slices/authSlice";
import { FaUser, FaKey, FaCog, FaSignOutAlt } from "react-icons/fa";
import { toast } from 'sonner';

const UserAvatar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser) || {};

  const initials = (() => {
    if (user?.firstName && user?.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user?.name) return user.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  })();

  const displayName = user?.firstName || user?.name || user?.email || 'User';

  const go = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    dispatch(logout());
    toast.success('Signed out');
    navigate('/log-in');
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <div className="hidden md:block text-right">
          <div className="text-sm font-semibold text-gray-800">{displayName}</div>
          <div className="text-xs text-gray-500 truncate">{user?.email || ''}</div>
        </div>

        <button
          aria-label="User menu"
          onClick={() => setIsDropdownOpen(v => !v)}
          className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md hover:scale-105 transition-transform"
        >
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt={displayName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="font-bold">{initials}</span>
          )}
        </button>
      </div>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-white to-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl text-gray-700">{initials}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{displayName}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email || ''}</div>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button onClick={() => go('/profile')} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 flex items-center gap-3">
              <FaUser className="text-gray-500" />
              <span className="text-sm text-gray-700">My Profile</span>
            </button>

            <button onClick={() => go('/change-password')} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 flex items-center gap-3">
              <FaKey className="text-gray-500" />
              <span className="text-sm text-gray-700">Change Password</span>
            </button>

            <button onClick={() => go('/settings')} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 flex items-center gap-3">
              <FaCog className="text-gray-500" />
              <span className="text-sm text-gray-700">Settings</span>
            </button>
          </div>

          <div className="border-t border-gray-100 p-2">
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 flex items-center gap-3">
              <FaSignOutAlt className="text-red-600" />
              <span className="text-sm text-red-600">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;