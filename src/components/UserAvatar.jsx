import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, selectUser, getProfile,logoutUser  } from "../redux/slices/authSlice";
import { FaUser, FaKey, FaCog, FaSignOutAlt } from "react-icons/fa";
import { toast } from 'sonner';

const UserAvatar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // ✅ SINGLE SOURCE - Use selectUser only (your inspect shows this structure)
  const user = useSelector(selectUser) || {};
  
  // ✅ Your API returns: user.photo = "http://localhost:4000/uploads/profiles/..."
  const photoUrl = user.photo;
  
  const initials = (() => {
    if (user?.firstName && user?.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user?.name) return user.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  })();

  const displayName = user?.firstName || user?.name || user?.email || 'User';

  const handleImageError = useCallback(() => {
    console.log('❌ Image failed:', photoUrl);
    setImageError(true);
  }, [photoUrl]);

  const handleImageLoad = useCallback(() => {
    console.log('✅ Image loaded:', photoUrl);
    setImageError(false);
  }, [photoUrl]);

  const go = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

const handleLogout = async () => {
  setIsDropdownOpen(false);
  await dispatch(logoutUser ()); 
  dispatch(logout());         
  toast.success('Signed out');
  navigate('/log-in', { replace: true });
};

  // ✅ Load profile on mount if no photo
  useEffect(() => {
    if (user && !photoUrl && !imageError) {
      console.log('🔄 Fetching profile for avatar...');
      dispatch(getProfile());
    }
  }, [dispatch, photoUrl, imageError, user]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <div className="hidden md:block text-right">
          <div className="text-sm font-semibold text-gray-800">{displayName}</div>
          <div className="text-xs text-gray-500 truncate">{user?.email || ''}</div>
        </div>

        <button
          onClick={() => setIsDropdownOpen(v => !v)}
          className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md hover:scale-105 transition-all duration-200 flex items-center justify-center"
          aria-label="User menu"
        >
          {photoUrl && !imageError ? (
            <img 
              src={photoUrl}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          ) : (
            <span className="font-bold text-sm leading-none">{initials}</span>
          )}
        </button>
      </div>

      {/* Dropdown - SAME AS YOURS */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 bg-gradient-to-r from-white to-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">{displayName}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                {photoUrl && !imageError && (
                  <div className="text-xs text-blue-600 truncate mt-1 font-mono">
                    📸 {photoUrl.split('/').pop()?.slice(0, 15)}...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-2 divide-y divide-gray-100">
            <button onClick={() => go('/profile')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 flex items-center gap-3 text-sm transition-colors">
              <FaUser className="text-gray-500 w-4 h-4" />
              <span className="text-gray-700 font-medium">My Profile</span>
            </button>

            <button onClick={() => go('/change-password')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-amber-50 flex items-center gap-3 text-sm transition-colors">
              <FaKey className="text-gray-500 w-4 h-4" />
              <span className="text-gray-700 font-medium">Change Password</span>
            </button>

            <button onClick={() => go('/settings')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors">
              <FaCog className="text-gray-500 w-4 h-4" />
              <span className="text-gray-700 font-medium">Settings</span>
            </button>

            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 flex items-center gap-3 text-sm transition-colors text-red-600 font-medium"
            >
              <FaSignOutAlt className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
