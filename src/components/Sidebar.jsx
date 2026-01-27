// Sidebar.jsx - Enterprise Dark Sidebar
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import { MODULE_MAP } from "../App/moduleMap.jsx";
import { setSidebarCollapsed } from "../redux/slices/authSlice";
import * as Icons from "../icons";

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isSidebarCollapsed } = useSelector((state) => state.auth);
  const modules = user?.modules || [];

  return (
    <aside className={clsx(
      "h-screen bg-gray-900 text-gray-300 flex flex-col sticky top-0 transition-all duration-300 ease-in-out z-50 shadow-2xl",
      isSidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-gray-700 bg-gray-800">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">TM</span>
            </div>
            <span className="font-bold text-white tracking-tight text-lg">Task Manager</span>
          </div>
        )}
        <button
          onClick={() => dispatch(setSidebarCollapsed(!isSidebarCollapsed))}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
          title={isSidebarCollapsed ? "Expand" : "Collapse"}
        >
          <Icons.Menu className="tm-icon" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-8 px-4 space-y-2 overflow-y-auto scrollbar-hide">
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
                "group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 relative",
                isActive
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-900/30"
                  : "hover:bg-gray-800 hover:text-white text-gray-300"
              )}
            >
              <span className="transition-transform duration-200 group-hover:scale-110 flex-shrink-0">
                {meta.icon}
              </span>
              {!isSidebarCollapsed && (
                <span className="font-medium text-sm truncate">{meta.label || mod.name}</span>
              )}
              {isActive && !isSidebarCollapsed && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className={clsx("flex items-center gap-3", isSidebarCollapsed ? "justify-center" : "px-2")}>
          <div className="w-10 h-10 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary-700">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user?.role || "Admin"}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
