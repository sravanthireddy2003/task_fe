import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import { MODULE_MAP } from "../App/moduleMap.jsx";
import { setSidebarCollapsed } from "../redux/slices/authSlice";
import { Menu, ChevronLeft, LogOut, Settings } from "lucide-react";

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isSidebarCollapsed } = useSelector((state) => state.auth);

  const modules = user?.modules || [];

  return (
    <aside
      className={clsx(
        "h-screen bg-slate-900 text-slate-300 flex flex-col sticky top-0 transition-all duration-300 ease-in-out z-50",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* HEADER */}
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
        >
          {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 mt-6 px-3 space-y-1">
        {modules.map((mod, idx) => {
          const meta = MODULE_MAP[mod.name];
          if (!meta) return null;
          const isActive = location.pathname.startsWith(mod.path);

          return (
            <Link
              key={idx}
              to={mod.path}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative",
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <span className={clsx("transition-transform duration-200 group-hover:scale-110")}>
                {meta.icon}
              </span>
              {!isSidebarCollapsed && (
                <span className="font-medium text-[14px]">{meta.label || mod.name}</span>
              )}
              {isActive && !isSidebarCollapsed && (
                <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER / USER PROFILE */}
      <div className="p-4 border-t border-slate-800">
        <div className={clsx("flex items-center gap-3", isSidebarCollapsed ? "justify-center" : "px-2")}>
          <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 border border-slate-600" />
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-slate-500 truncate">Premium Plan</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;