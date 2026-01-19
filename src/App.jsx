// App.jsx - COMPLETE FIXED (NO PAGE RELOADS, MANAGER UI PRESERVED)
import { Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";

import { 
  getProfile, 
  selectUser, 
  setCredentials
} from "./redux/slices/authSlice";

import { fetchNotifications } from "./redux/slices/notificationSlice";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import TaskDetails from "./pages/TaskDetails";
import Tasks from "./pages/Tasks";
import EmployeeTasks from "./pages/EmployeeTasks";
import ManagerClients from "./pages/ManagerClients";
import ManagerProjects from "./pages/ManagerProjects";
import ManagerTasks from "./pages/ManagerTasks";
import Report from "./pages/Report";
import Users from "./pages/Users";
import Client from "./pages/Client";
import ClientDashboard from "./pages/ClientDashboard";
import DashboardRouter from "./components/DashboardRouter";
import AddClient from "./pages/AddClientsP";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import Forgot from "./pages/Forgot";
import Reset from "./pages/Reset";
import ModuleRouteGuard from "./components/ModuleRouteGuard";

import PageNotFound from "./pages/PageNotFound";
import Departments from "./pages/Departments";
import Projects from "./pages/Projects";
import Documents from "./pages/Documents";
import ClientDocuments from "./pages/client/ClientDocuments";
import ClientAssignedTasks from "./pages/client/ClientAssignedTasks";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import ManagerChat from "./pages/ManagerChat";
import EmployeeChat from "./pages/EmployeeChat";
import Workflow from "./pages/Workflow";
import Notifications from "./pages/Notifications";
import Trash from "./pages/Trash";
import Approvals from "./pages/Approvals";
import LandingPage from "./Landingpage";
import ModuleDetail from "./pages/ModuleDetail";
import { getFallbackModules, getFallbackSidebar } from "./utils/apiGuide";
import { MODULE_MAP } from "./App/moduleMap.jsx";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerUsers from "./pages/ManagerUsers";
import RoleRoute from "./components/RoleRoute";
import EmployeeHome from "./pages/EmployeeHome";
import ClientViewerHome from "./pages/ClientViewerHome";
import ReassignTaskRequest from "./pages/ReassignTaskRequest"; 
import TaskDetailsWithRequests from "./pages/TaskDetailsWithRequests.jsx";

const ROLE_PREFIXES = ["admin", "manager", "employee", "client", "client-viewer"];

const MODULE_ROUTE_CONFIG = [
  { moduleName: "Dashboard", Component: DashboardRouter },
  { moduleName: "User Management", Component: Users },
  { moduleName: "Clients", Component: Client },
  { moduleName: "Departments", Component: Departments },
  { moduleName: "Tasks", Component: Tasks },
  { moduleName: "Projects", Component: Projects },
  { moduleName: "Reports & Analytics", Component: Report },
  { moduleName: "Document & File Management", Component: Documents },  
  { moduleName: "Chat / Real-Time Collaboration", Component: Chat },    
  { moduleName: "Workflow (Project & Task Flow)", Component: Workflow }, 
  { moduleName: "Notifications", Component: Notifications },           
  { moduleName: "Approval Workflows", Component: Approvals },          
  { moduleName: "Settings & Master Configuration", Component: Settings },
  { moduleName: "Task Reassignment Requests", Component: ReassignTaskRequest }
];

const slugifyModuleName = (name = "") =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildModulePaths = (moduleName) => {
  const moduleMeta = MODULE_MAP[moduleName];
  const basePath = (moduleMeta?.link || `/${slugifyModuleName(moduleName)}`)
    .replace(/^\//, ""); 

  return ROLE_PREFIXES.map((prefix) => `/${prefix}/${basePath}`);
};

// -------- Layout for logged-in users --------
function Layout() {
  const location = useLocation();
  const { user, isSidebarCollapsed } = useSelector((state) => state.auth);

  return user ? (
    <div className="w-full h-screen flex flex-row bg-gray-100">
      {/* Sidebar */}
      <div
        className={clsx(
          "h-screen bg-gray-900 border-r border-gray-700 hidden md:flex sticky top-0 z-40 transition-all duration-300 ease-in-out shadow-xl",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Navbar */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
          <Navbar />
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="min-h-full p-6 lg:p-8 xl:p-10 max-w-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Navigate to="/log-in" state={{ from: location }} replace />
  );
}

const MobileSidebar = () => {
  const { isSidebarOpen } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const closeSidebar = () => dispatch({ type: "auth/setOpenSidebar", payload: false });

  const handleNavigation = (path) => {
    closeSidebar();
    navigate(path);
  };

  return (
    <Transition
      show={isSidebarOpen}
      as={Fragment}
      enter="transition-all duration-300 ease-in-out"
      enterFrom="translate-x-full opacity-0"
      enterTo="translate-x-0 opacity-100"
      leave="transition-all duration-300 ease-in-out"
      leaveFrom="translate-x-0 opacity-100"
      leaveTo="translate-x-full opacity-0"
    >
      <div 
        className="md:hidden fixed inset-0 bg-black/50 z-50 flex"
        onClick={closeSidebar}
      >
        <div
          className="bg-slate-900 w-80 h-full shadow-2xl flex flex-col text-slate-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-white tracking-tight text-xl">Task Manager</span>
            </div>
            <button 
              onClick={closeSidebar} 
              className="p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400"
            >
              <IoClose size={24} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            <MobileNav onNavigate={handleNavigation} />
          </nav>
        </div>
      </div>
    </Transition>
  );
};

const MobileNav = ({ onNavigate }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const modules = user?.modules || [];

  return (
    <>
      {modules.map((mod, idx) => {
        const meta = MODULE_MAP[mod.name];
        if (!meta) return null;
        const pathSegment = meta.link.replace(/^\//, "");
        const fullPath = `/${user.role.toLowerCase()}/${pathSegment}`;
        const isActive = location.pathname.startsWith(fullPath);

        return (
          <button
            key={idx}
            onClick={() => onNavigate(fullPath)}
            className={clsx(
              "group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 relative text-left text-slate-300",
              isActive
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <span className="text-lg transition-transform duration-200 group-hover:scale-110 flex-shrink-0">
              {meta.icon}
            </span>
            <span className="font-medium text-[14px] flex-1">{meta.label || mod.name}</span>
            {isActive && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </button>
        );
      })}
      
      <div className="p-4 border-t border-slate-800 mt-8">
        <button 
          onClick={() => onNavigate('/profile')}
          className={clsx(
            "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
            "hover:bg-slate-800 text-slate-300"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 border-2 border-slate-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-white truncate">{user?.name || "Admin"}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{user?.role || "Admin"}</p>
          </div>
        </button>
      </div>
    </>
  );
};

// -------- Main App --------
function App() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  // ✅ FIXED: Manager UI Preservation After Refresh + Fetch Notifications
  useEffect(() => {
    if (!user || !user.role || !user.id) return;

    const roleLower = user.role.toLowerCase();
    const isManager = roleLower === 'manager';

    // Only apply fallback if modules/sidebar are missing AND role needs fallback
    const needsModuleFallback = !Array.isArray(user.modules) || user.modules.length === 0;
    const needsSidebarFallback = !Array.isArray(user.sidebar) || user.sidebar.length === 0;
    
    const shouldApplyFallback = (role) => {
      if (!role) return false;
      const fallbackRoles = ["manager", "employee", "client", "client-viewer"];
      return fallbackRoles.includes(role.toLowerCase());
    };

    if ((needsModuleFallback || needsSidebarFallback) && shouldApplyFallback(user.role)) {
      console.log(`[Fallback] Applying for role: ${user.role}`);
      
      const fallbackModules = needsModuleFallback ? getFallbackModules(user.role) : user.modules;
      const fallbackSidebar = needsSidebarFallback ? getFallbackSidebar(user.role) : user.sidebar;
      
      const updatedUser = {
        ...user, // ✅ PRESERVE original role: "Manager"
        modules: fallbackModules,
        sidebar: fallbackSidebar,
      };
      
      dispatch(setCredentials(updatedUser));
    }

    // ✅ Only fetch profile if needed (not for Manager to avoid admin override)
    if (needsModuleFallback && shouldApplyFallback(user.role) && !isManager) {
      dispatch(getProfile());
    }

    // ✅ NEW: Fetch notifications after login
    dispatch(fetchNotifications());
  }, [dispatch, user?.id]); // ✅ Safe dependency: user.id only

  return (
    <main className="w-full min-h-screen bg-gray-50 relative">
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<Layout />}>
          {MODULE_ROUTE_CONFIG.map(({ moduleName, Component }) => {
            // Skip guarded route generation for Settings so explicit role routes handle it
            if (moduleName === 'Settings & Master Configuration') return null;
            const moduleMeta = MODULE_MAP[moduleName];
            const basePath = (moduleMeta?.link || `/${slugifyModuleName(moduleName)}`).replace(/^\//, "");

            if (moduleName === "Dashboard") {
              return (
                <Route
                  element={<ModuleRouteGuard moduleName={moduleName} />}
                  key={`guard-${moduleName}`}
                >
                  {ROLE_PREFIXES.map((prefix) => {
                    const path = `/${prefix}/${basePath}`;
                    const ComponentForRole = prefix.startsWith("client") ? ClientDashboard : DashboardRouter;
                    return (
                      <Route
                        key={`${moduleName}-${path}`}
                        path={path}
                        element={<ComponentForRole />}
                      />
                    );
                  })}
                </Route>
              );
            }

            if (moduleName === "Document & File Management") {
              return (
                <Route
                  element={<ModuleRouteGuard moduleName={moduleName} />}
                  key={`guard-${moduleName}`}
                >
                  {ROLE_PREFIXES.map((prefix) => {
                    const path = `/${prefix}/${basePath}`;
                    const ComponentForRole = prefix.startsWith("client") ? ClientDocuments : Documents;
                    return (
                      <Route
                        key={`${moduleName}-${path}`}
                        path={path}
                        element={<ComponentForRole />}
                      />
                    );
                  })}
                </Route>
              );
            }

            if (moduleName === "Tasks") {
              return (
                <Route
                  element={<ModuleRouteGuard moduleName={["Tasks", "Assigned Tasks"]} />}
                  key={`guard-${moduleName}`}
                >
                  {ROLE_PREFIXES.map((prefix) => {
                    const path = `/${prefix}/${basePath}`;
                    let ComponentForRole = Tasks;
                    if (prefix === "employee") ComponentForRole = EmployeeTasks;
                    if (prefix === "manager") ComponentForRole = ManagerTasks;
                    if (prefix.startsWith("client")) ComponentForRole = ClientAssignedTasks;
                    return (
                      <Route
                        key={`${moduleName}-${path}`}
                        path={path}
                        element={<ComponentForRole />}
                      />
                    );
                  })}
                  <Route path="/employee/tasks/:taskId" element={<TaskDetailsWithRequests />} />
                </Route>
              );
            }

            if (moduleName === "User Management") {
              return (
                <Route
                  element={<ModuleRouteGuard moduleName={moduleName} />}
                  key={`guard-${moduleName}`}
                >
                  {ROLE_PREFIXES.map((prefix) => {
                    const path = `/${prefix}/${basePath}`;
                    const ComponentForRole = prefix === "manager" ? ManagerUsers : Users;
                    return (
                      <Route
                        key={`${moduleName}-${path}`}
                        path={path}
                        element={<ComponentForRole />}
                      />
                    );
                  })}
                </Route>
              );
            }

            if (moduleName === "Clients") {
              return (
                <Route
                  element={<ModuleRouteGuard moduleName={moduleName} />}
                  key={`guard-${moduleName}`}
                >
                  {ROLE_PREFIXES.map((prefix) => {
                    const path = `/${prefix}/${basePath}`;
                    const ComponentForRole = prefix === "manager" ? ManagerClients : Client;
                    return (
                      <Route
                        key={`${moduleName}-${path}`}
                        path={path}
                        element={<ComponentForRole />}
                      />
                    );
                  })}
                </Route>
              );
            }

            if (moduleName === "Projects") {
              return (
                <Route
                  element={<ModuleRouteGuard moduleName={moduleName} />}
                  key={`guard-${moduleName}`}
                >
                  {ROLE_PREFIXES.map((prefix) => {
                    const path = `/${prefix}/${basePath}`;
                    const ComponentForRole = prefix === "manager" ? ManagerProjects : Projects;
                    return (
                      <Route
                        key={`${moduleName}-${path}`}
                        path={path}
                        element={<ComponentForRole />}
                      />
                    );
                  })}
                </Route>
              );
            }

            if (moduleName === "Chat / Real-Time Collaboration") {
              return (
                <Route
                  element={<ModuleRouteGuard moduleName={moduleName} />}
                  key={`guard-${moduleName}`}
                >
                  {ROLE_PREFIXES.map((prefix) => {
                    const path = `/${prefix}/${basePath}`;
                    let ComponentForRole = Chat;
                    if (prefix === "manager") ComponentForRole = ManagerChat;
                    if (prefix === "employee") ComponentForRole = EmployeeChat;
                    return (
                      <Route
                        key={`${moduleName}-${path}`}
                        path={path}
                        element={<ComponentForRole />}
                      />
                    );
                  })}
                </Route>
              );
            }

            return (
              <Route
                element={<ModuleRouteGuard moduleName={moduleName} />}
                key={`guard-${moduleName}`}
              >
                {buildModulePaths(moduleName).map((path) => (
                  <Route key={`${moduleName}-${path}`} path={path} element={<Component />} />
                ))}
              </Route>
            );
          })}

          {ROLE_PREFIXES.map((prefix) => (
            <Route
              element={<ModuleRouteGuard moduleName="Reports & Analytics" />}
              key={`analytics-alias-${prefix}`}
            >
              <Route path={`/${prefix}/analytics`} element={<Report />} />
            </Route>
          ))}

          {/* ✅ NEW: Notification routes for all roles (singular & plural) */}
          <Route element={<ModuleRouteGuard moduleName="Notifications" />}>
            <Route path="/admin/notifications" element={<Notifications />} />
            <Route path="/admin/notification" element={<Notifications />} />
            <Route path="/manager/notifications" element={<Notifications />} />
            <Route path="/manager/notification" element={<Notifications />} />
            <Route path="/employee/notifications" element={<Notifications />} />
            <Route path="/employee/notification" element={<Notifications />} />
          </Route>

          <Route element={<ModuleRouteGuard moduleName="Clients" />}>
            <Route path="/add-client" element={<AddClient />} />
            <Route path="/client-dashboard/:id" element={<ClientDashboard />} />
          </Route>
          
          <Route element={<ModuleRouteGuard moduleName="Tasks" />}>
            <Route path="/task/:id" element={<TaskDetails />} />
            <Route path="/employee/tasks/:taskId" element={<TaskDetailsWithRequests />} />
          </Route>

          <Route path="/trash" element={<Trash />} />
          <Route path="/module/:moduleId" element={<ModuleDetail />} />

          <Route path="/home/admin" element={<RoleRoute role="Admin" Component={AdminDashboard} />} />
          <Route path="/home/manager" element={<RoleRoute role="Manager" Component={ManagerDashboard} />} />
          <Route path="/home/employee" element={<RoleRoute role="Employee" Component={EmployeeHome} />} />
          <Route path="/home/client-viewer" element={<RoleRoute role="Client-Viewer" Component={ClientViewerHome} />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Explicit role-scoped settings routes to avoid 404 when modules list lacks Settings */}
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/manager/settings" element={<Settings />} />
          <Route path="/employee/settings" element={<Settings />} />
        </Route>

        <Route path="/log-in" element={<Login />} />
        <Route path="/login" element={<Navigate to="/log-in" replace />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>

      <MobileSidebar />
      <Toaster richColors />
    </main>
  );
}

export default App;
