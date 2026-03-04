// Sidebar.jsx - Enterprise Dark Sidebar
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { MODULE_MAP } from "../App/moduleMap.jsx";
import { setSidebarCollapsed } from "../redux/slices/authSlice";
import { logout, logoutUser } from "../redux/slices/authSlice";
import * as Icons from "../icons";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSidebarCollapsed: reduxIsCollapsed } = useSelector((state) => state.auth);
  const modules = user?.modules || [];
  const [isHovered, setIsHovered] = React.useState(false);

  // The sidebar is treated as expanded if Redux says it's expanded OR if the user is hovering over it
  const isSidebarCollapsed = reduxIsCollapsed && !isHovered;

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

  const rolePrefix = user?.role?.toLowerCase() || 'admin';

  return (
    <>
      {/* Invisible overlay to catch clicks if we expanded via hover over a collapsed sidebar */}
      {reduxIsCollapsed && isHovered && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none transition-all hidden md:block"
          onClick={() => setIsHovered(false)}
        />
      )}

      <aside
        className={clsx(
          "h-full flex flex-col transition-all duration-300 ease-in-out group/sidebar overflow-hidden",
          "bg-gradient-to-b from-[#0D1117] via-[#111827] to-[#0F172A]",
          "text-gray-300 border-r border-white/[0.04]",
          reduxIsCollapsed
            ? "absolute top-0 left-0 z-50 shadow-2xl"
            : "w-full relative z-40",
          isSidebarCollapsed ? "w-[72px]" : "w-[240px]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header / Logo */}
        <div className={clsx("flex items-center h-16 flex-shrink-0 transition-all duration-300 relative border-b border-white/[0.04]", isSidebarCollapsed ? "justify-center px-0" : "px-5")}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1" onClick={() => navigate(`/${rolePrefix}/dashboard`)}>
              <div className="min-w-8 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}>
                <span className="text-white font-bold text-[13px]">TM</span>
              </div>
              <div>
                <span className="font-bold text-white tracking-tight text-[15px] whitespace-nowrap block leading-tight">Task Manager</span>
                <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-widest">Enterprise</span>
              </div>
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}
              onClick={() => navigate(`/${rolePrefix}/dashboard`)}>
              <span className="text-white font-bold text-[13px]">TM</span>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button
              onClick={() => dispatch(setSidebarCollapsed(!reduxIsCollapsed))}
              className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover/sidebar:opacity-100 hidden md:flex"
              title="Collapse Sidebar"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {isSidebarCollapsed && (
            <button
              onClick={() => dispatch(setSidebarCollapsed(!reduxIsCollapsed))}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#1F2937] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors shadow-md opacity-0 group-hover/sidebar:opacity-100 hidden md:flex"
              title="Expand Sidebar"
            >
              <Icons.ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-4">
          {modules.map((mod, idx) => {
            const meta = MODULE_MAP[mod.name];
            if (!meta) return null;
            const pathSegment = meta.link.replace(/^\//, "");
            const fullPath = `/${rolePrefix}/${pathSegment}`;
            const isActive = location.pathname.startsWith(fullPath);

            return (
              <div
                key={idx}
                onClick={() => {
                  navigate(fullPath);
                  setIsHovered(false);
                }}
                className={clsx(
                  "group flex items-center p-2.5 rounded-xl transition-all duration-200 relative cursor-pointer",
                  isActive
                    ? "sidebar-glow-active text-indigo-400"
                    : "hover:bg-white/[0.06] hover:text-white text-gray-400",
                  isSidebarCollapsed ? "justify-center" : "gap-3"
                )}
                title={isSidebarCollapsed ? meta.label || mod.name : undefined}
              >
                <span className={clsx(
                  "transition-all duration-200 flex-shrink-0",
                  isActive
                    ? "text-indigo-400 scale-110"
                    : "text-gray-400 group-hover:text-white group-hover:scale-110"
                )}>
                  {meta.icon}
                </span>
                {!isSidebarCollapsed && (
                  <span className="text-[13.5px] truncate font-medium text-inherit whitespace-nowrap transition-opacity">{meta.label || mod.name}</span>
                )}

                {/* Tooltip for collapsed mode */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1F2937] text-white text-[12px] font-medium rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 pointer-events-none">
                    {meta.label || mod.name}
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1F2937] border-l border-b border-white/10 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto px-3 pb-4 space-y-1 flex-shrink-0 border-t border-white/[0.04] pt-4">

          {/* Settings */}
          <div
            onClick={() => navigate(`/${rolePrefix}/settings`)}
            className={clsx(
              "group flex items-center p-2.5 rounded-xl transition-all duration-200 relative cursor-pointer",
              location.pathname.startsWith(`/${rolePrefix}/settings`)
                ? "sidebar-glow-active text-indigo-400"
                : "hover:bg-white/[0.06] hover:text-white text-gray-400",
              isSidebarCollapsed ? "justify-center" : "gap-3"
            )}
          >
            <span className="transition-all duration-200 group-hover:scale-110 flex-shrink-0 text-inherit">
              <Icons.Settings className="w-5 h-5" />
            </span>
            {!isSidebarCollapsed && (
              <span className="text-[13.5px] truncate font-medium text-inherit">Settings</span>
            )}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1F2937] text-white text-[12px] font-medium rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 pointer-events-none">
                Settings
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1F2937] border-l border-b border-white/10 rotate-45" />
              </div>
            )}
          </div>

          {/* Logout */}
          <div
            onClick={handleLogout}
            className={clsx(
              "group flex items-center p-2.5 rounded-xl transition-all duration-200 relative cursor-pointer hover:bg-red-500/10 hover:text-red-400 text-gray-400",
              isSidebarCollapsed ? "justify-center" : "gap-3"
            )}
          >
            <span className="transition-all duration-200 group-hover:scale-110 flex-shrink-0 text-inherit">
              <Icons.LogOut className="w-5 h-5" />
            </span>
            {!isSidebarCollapsed && (
              <span className="text-[13.5px] truncate font-medium text-inherit">Log Out</span>
            )}
            {isSidebarCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1F2937] text-white text-[12px] font-medium rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 pointer-events-none">
                Log Out
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1F2937] border-l border-b border-white/10 rotate-45" />
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className={clsx(
            "mt-3 flex items-center rounded-xl p-2.5 bg-white/[0.04] border border-white/[0.06]",
            isSidebarCollapsed ? "justify-center border-none bg-transparent" : "gap-3"
          )}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer shadow-lg shadow-indigo-500/20"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}
              onClick={() => navigate('/profile')}
            >
              <span className="text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('/profile')}>
                <p className="text-[13px] font-semibold text-white truncate">{user?.name || "User"}</p>
                <span className="inline-block text-[9px] text-indigo-400 truncate uppercase tracking-widest font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded-full">{user?.role || "Role"}</span>
              </div>
            )}
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
