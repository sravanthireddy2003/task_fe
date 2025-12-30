// Sidebar.jsx - DESKTOP ONLY (No Mobile, No Double Header)
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import { MODULE_MAP } from "../App/moduleMap.jsx";
import { setSidebarCollapsed } from "../redux/slices/authSlice";
import { Menu, ChevronLeft } from "lucide-react";

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isSidebarCollapsed } = useSelector((state) => state.auth);
  const modules = user?.modules || [];

  return (
    <aside className={clsx(
      "h-screen bg-slate-900 text-slate-300 flex flex-col sticky top-0 transition-all duration-300 ease-in-out z-50",
      isSidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* ✅ DESKTOP HEADER ONLY */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-white tracking-tight text-xl">Task Manager</span>
          </div>
        )}
        <button
          onClick={() => dispatch(setSidebarCollapsed(!isSidebarCollapsed))}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400"
          title={isSidebarCollapsed ? "Expand" : "Collapse"}
        >
          {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* ✅ DESKTOP NAVIGATION */}
      <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {modules.map((mod, idx) => {
          const meta = MODULE_MAP[mod.name];
          if (!meta) return null;
          const pathSegment = meta.link.replace(/^\//, "");
          const fullPath = `/${user.role.toLowerCase()}/${pathSegment}`;
          const isActive = location.pathname.startsWith(fullPath);

          return (
            <Link
              key={idx}
              to={fullPath}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative",
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                  : "hover:bg-slate-800 hover:text-white text-slate-300"
              )}
            >
              <span className="transition-transform duration-200 group-hover:scale-110 flex-shrink-0">
                {meta.icon}
              </span>
              {!isSidebarCollapsed && (
                <span className="font-medium text-[14px] truncate">{meta.label || mod.name}</span>
              )}
              {isActive && !isSidebarCollapsed && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ✅ DESKTOP FOOTER */}
      <div className="p-4 border-t border-slate-800">
        <div className={clsx("flex items-center gap-3", isSidebarCollapsed ? "justify-center" : "px-2")}>
          <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 border-2 border-slate-600">
            <span className="text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role || "Admin"}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
