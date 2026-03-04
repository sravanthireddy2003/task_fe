// Sidebar.jsx - Enterprise Dark Sidebar
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { MODULE_MAP } from "../App/moduleMap.jsx";
import { setSidebarCollapsed } from "../redux/slices/authSlice";
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
          "h-full overflow-hidden transition-all duration-300 ease-in-out group/sidebar",
          "bg-gradient-to-b from-[#0D1117] via-[#111827] to-[#0F172A]",
          "text-gray-300 border-r border-white/[0.04]",
          "relative z-40 shadow-xl flex-shrink-0",
          isSidebarCollapsed ? "w-[72px]" : "w-[240px]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-[240px] min-w-[240px] flex flex-col h-full shrink-0">

          {/* Header / Logo */}
          <div className="flex items-center h-16 flex-shrink-0 relative border-b border-white/[0.04] px-5">
            <div className="flex items-center gap-3 cursor-pointer flex-1 overflow-hidden" onClick={() => navigate(`/${rolePrefix}/dashboard`)}>
              <div
                className="min-w-8 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}
              >
                <span className="text-white font-bold text-[13px]">TM</span>
              </div>
              <div className={clsx("transition-opacity duration-300 min-w-0 pr-2", isSidebarCollapsed ? "opacity-0" : "opacity-100")}>
                <span className="font-bold text-white tracking-tight text-[15px] block leading-tight truncate">Task Manager</span>
                <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-widest block truncate">Enterprise</span>
              </div>
            </div>

            <button
              onClick={() => dispatch(setSidebarCollapsed(!reduxIsCollapsed))}
              className={clsx(
                "p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shadow-md hidden md:flex",
                "opacity-0 group-hover/sidebar:opacity-100 absolute",
                reduxIsCollapsed && isHovered ? "right-3 bg-[#1F2937] border border-white/10 rounded-full w-6 h-6 items-center justify-center" : "right-3"
              )}
              title={reduxIsCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {reduxIsCollapsed && isHovered ? (
                <Icons.ChevronRight className="w-3 h-3" />
              ) : (
                <Icons.ChevronLeft className="w-4 h-4" />
              )}
            </button>
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
                    "group flex items-center p-2.5 rounded-xl transition-all duration-200 relative cursor-pointer gap-3",
                    isActive
                      ? "sidebar-glow-active text-indigo-400"
                      : "hover:bg-white/[0.06] hover:text-white text-gray-400"
                  )}
                  title={isSidebarCollapsed ? meta.label || mod.name : undefined}
                >
                  <span className={clsx(
                    "transition-all duration-200 flex-shrink-0 pl-[2px]",
                    isActive
                      ? "text-indigo-400 scale-110"
                      : "text-gray-400 group-hover:text-white group-hover:scale-110"
                  )}>
                    {meta.icon}
                  </span>
                  <span className={clsx(
                    "text-[13.5px] truncate font-medium text-inherit whitespace-nowrap transition-opacity duration-300",
                    isSidebarCollapsed ? "opacity-0" : "opacity-100"
                  )}>
                    {meta.label || mod.name}
                  </span>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
