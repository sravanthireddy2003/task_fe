import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import { MODULE_MAP } from "../App/moduleMap.jsx";
import { setSidebarCollapsed } from "../redux/slices/authSlice";

const DefaultModuleIcon = () => (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs font-medium text-gray-400">
    •
  </span>
);

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isSidebarCollapsed } = useSelector((state) => state.auth);

  const modules = user?.modules || [];
  
  return (
    <div
      className={clsx(
        "h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isSidebarCollapsed && (
          <h1 className="text-xl font-bold text-gray-800">Task Manager</h1>
        )}
        <button
          onClick={() => dispatch(setSidebarCollapsed(!isSidebarCollapsed))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isSidebarCollapsed ? "Expand" : "Collapse"}
        >
          <span className="text-lg">≡</span>
        </button>
      </div>

      <nav className="flex-1 mt-4 px-1 overflow-y-auto">
        {modules.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Loading modules...
          </div>
        ) : (
          modules.map((mod, idx) => {
            const moduleMeta = MODULE_MAP[mod.name];
            const resolvedPath = mod.path || moduleMeta?.link || "/";
            const label = moduleMeta?.label || mod.name;
            const icon = moduleMeta?.icon || <DefaultModuleIcon />;
            const isActive =
              location.pathname === resolvedPath ||
              location.pathname.startsWith(`${resolvedPath}/`);

            return (
              <Link
                key={`${mod.name}-${idx}`}
                to={resolvedPath}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg mx-2 mb-1 transition-all group",
                  isActive
                    ? "bg-blue-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
                title={label}
              >
                <span className="text-xl flex-shrink-0">
                  {icon}
                </span>
                {!isSidebarCollapsed && (
                  <span className="font-medium truncate">{label}</span>
                )}
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
