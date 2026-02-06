import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, selectUser, getProfile, logoutUser, selectProfileFetched, selectProfileLoading } from "../redux/slices/authSlice";
import * as Icons from "../icons";
import { toast } from 'sonner';

const UserAvatar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectUser) || {};
  const profileFetched = useSelector(selectProfileFetched);
  const profileLoading = useSelector(selectProfileLoading);
  const photoUrl = user.photo;

  // Helper to ensure photo URL is served via proxy (same origin) to satisfy CORP
  const getSafePhotoUrl = (url) => {
    if (!url) return null;
    try {
      if (url.includes('localhost:4000')) {
        const urlObj = new URL(url);
        return urlObj.pathname + urlObj.search;
      }
    } catch (e) { console.error('URL parse error', e); }
    return url;
  };

  const safePhotoUrl = getSafePhotoUrl(photoUrl);

  const initials = (() => {
    if (user?.firstName && user?.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user?.name) return user.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  })();

  const displayName = user?.firstName || user?.name || user?.email || 'User';

  const handleImageError = useCallback(() => {
    // Avoid noisy console output; set a data-uri fallback to stop repeated 404s
    setImageError(true);
    try {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='100%' height='100%' fill='%23829BE0' /><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='48' fill='white'>${initials}</text></svg>`;
      const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      setFallbackSrc(dataUri);
    } catch (e) {
      setFallbackSrc(null);
    }
  }, [initials]);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
  }, []);

  // Reset error state when photo URL changes
  useEffect(() => {
    setImageError(false);
  }, [safePhotoUrl]);

  const go = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await dispatch(logoutUser());
    dispatch(logout());
    toast.success('Signed out');
    navigate('/log-in', { replace: true });
  };

  // ✅ FIXED useEffect - NO MORE INFINITE CALLS
  useEffect(() => {
    // Guards: Skip if no user, already fetched, currently loading, has modules, or has photo
    if (!user?.id || profileFetched || profileLoading || user.modules?.length > 0 || safePhotoUrl) {
      return;
    }

    console.log('🔄 Fetching profile for avatar...');

    const fetchProfile = async () => {
      try {
        await dispatch(getProfile()).unwrap();
      } catch (err) {
        console.error('Profile fetch failed:', err);
        if (err.status === 401) {
          dispatch(logout());
          navigate('/log-in', { replace: true });
        }
      }
    };

    fetchProfile();
  }, [dispatch, user?.id, profileFetched, profileLoading, safePhotoUrl]);

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
          {safePhotoUrl && !imageError ? (
            <img
              src={safePhotoUrl}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          ) : fallbackSrc ? (
            <img src={fallbackSrc} alt={displayName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="font-bold text-sm leading-none">{initials}</span>
          )}
        </button>
      </div>

      {/* Dropdown - UNCHANGED */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-4 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl z-50 border border-white/20 ring-1 ring-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-bold text-white shadow-lg ring-2 ring-white/10 overflow-hidden">
                {safePhotoUrl && !imageError ? (
                  <img
                    src={safePhotoUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg truncate leading-tight">{displayName}</div>
                <div className="text-sm text-slate-300 truncate">{user?.email}</div>
                {user?.role && (
                  <div className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-medium uppercase tracking-wider text-blue-200">
                    {user.role}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-2 flex flex-col gap-1 bg-white/50">
            <button onClick={() => go('/profile')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 group flex items-center gap-3 text-sm transition-all duration-200">
              <div className="p-2 rounded-lg bg-blue-100/50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Icons.User className="w-4 h-4" />
              </div>
              <span className="text-gray-700 font-medium group-hover:text-blue-700">My Profile</span>
            </button>

            <button onClick={() => go('/change-password')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-amber-50 group flex items-center gap-3 text-sm transition-all duration-200">
              <div className="p-2 rounded-lg bg-amber-100/50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                <Icons.KeyRound className="w-4 h-4" />
              </div>
              <span className="text-gray-700 font-medium group-hover:text-amber-700">Change Password</span>
            </button>

            <button
              onClick={() => {
                const role = (user?.role || '').toString().toLowerCase();
                let path = '/admin/settings';
                if (role.includes('manager')) path = '/manager/settings';
                else if (role.includes('employee')) path = '/employee/settings';
                else if (role.includes('client')) path = '/client/settings';
                go(path);
              }}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 group flex items-center gap-3 text-sm transition-all duration-200"
            >
              <div className="p-2 rounded-lg bg-slate-100/50 text-slate-600 group-hover:bg-slate-100 transition-colors">
                <Icons.Settings className="w-4 h-4" />
              </div>
              <span className="text-gray-700 font-medium group-hover:text-slate-700">Settings</span>
            </button>

            <div className="my-1 border-t border-gray-100 mx-2" />

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 group flex items-center gap-3 text-sm transition-all duration-200"
            >
              <div className="p-2 rounded-lg bg-red-100/50 text-red-600 group-hover:bg-red-100 transition-colors">
                <Icons.LogOut className="w-4 h-4" />
              </div>
              <span className="text-gray-700 font-medium group-hover:text-red-700">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
