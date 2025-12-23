import { Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import { getProfile, selectUser, setCredentials } from "./redux/slices/authSlice";

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
import ProtectedRoute from "./components/ProtectedRoute";
import ModuleRouteGuard from "./components/ModuleRouteGuard";

import PageNotFound from "./pages/PageNotFound";
import Departments from "./pages/Departments";
import Projects from "./pages/Projects";
import Documents from "./pages/Documents";
import ClientDocuments from "./pages/client/ClientDocuments";
import ClientAssignedTasks from "./pages/client/ClientAssignedTasks";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
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
    <div className="w-full h-screen flex flex-row bg-gray-50">
      {/* Sidebar */}
      <div
        className={clsx(
          "h-screen bg-white border-r border-gray-200 hidden md:block sticky top-0 z-40 transition-all duration-200 group",
          isSidebarCollapsed ? "w-16 group-hover:w-64" : "w-64"
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-4 2xl:px-10">
          <Outlet />
        </div>
      </div>

      <MobileSidebar />
    </div>
  ) : (
    <Navigate to="/log-in" state={{ from: location }} replace />
  );
}

// -------- Mobile Sidebar --------
const MobileSidebar = () => {
  const { isSidebarOpen } = useSelector((state) => state.auth);
  const mobileMenuRef = useRef(null);
  const dispatch = useDispatch();

  const closeSidebar = () => dispatch({ type: "auth/setOpenSidebar", payload: false });

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
        ref={(node) => (mobileMenuRef.current = node)}
        className="md:hidden fixed inset-0 bg-black/50 z-50 flex"
        onClick={closeSidebar}
      >
        <div
          className="bg-white w-80 h-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img src="/nmit.png" alt="Logo" className="h-10 w-12 rounded-lg" />
              <span className="text-xl font-semibold">Task Manager</span>
            </div>
            <button onClick={closeSidebar} className="p-2 rounded-xl hover:bg-gray-100">
              <IoClose size={24} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
            <Sidebar />
          </div>
        </div>
      </div>
    </Transition>
  );
};

// -------- Main App --------
function App() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user) return;

    const needsModuleFallback = !Array.isArray(user.modules) || user.modules.length === 0;
    const needsSidebarFallback = !Array.isArray(user.sidebar) || user.sidebar.length === 0;

    const fallbackModules = needsModuleFallback ? getFallbackModules(user.role) : [];
    const fallbackSidebar = needsSidebarFallback ? getFallbackSidebar(user.role) : [];

    const shouldApplyFallback =
      (needsModuleFallback && fallbackModules.length > 0) ||
      (needsSidebarFallback && fallbackSidebar.length > 0);

    if (shouldApplyFallback) {
      const updatedUser = { ...user };

      if (needsModuleFallback && fallbackModules.length > 0) {
        updatedUser.modules = fallbackModules;
      }
      if (needsSidebarFallback && fallbackSidebar.length > 0) {
        updatedUser.sidebar = fallbackSidebar;
      }

      dispatch(setCredentials(updatedUser));
    }

    if (needsModuleFallback) {
      dispatch(getProfile());
    }
  }, [dispatch, user]);

  return (
    <main className="w-full min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<Layout />}>
          {MODULE_ROUTE_CONFIG.map(({ moduleName, Component }) => {
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
                </Route>
              );
            }

            // Special handling for Clients: manager sees manager-specific clients page
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
              const pathPrefix = basePath;
              return (
                <Route
                  element={<ModuleRouteGuard moduleName={moduleName} />}
                  key={`guard-${moduleName}`}
                >
                  {ROLE_PREFIXES.map((prefix) => {
                    const path = `/${prefix}/${pathPrefix}`;
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

            // Special handling for Projects: manager sees manager-specific projects page
            if (moduleName === "Projects") {
              const pathPrefix = basePath;
              return (
                <Route
                  element={<ModuleRouteGuard moduleName={moduleName} />}
                  key={`guard-${moduleName}`}
                >
                  {ROLE_PREFIXES.map((prefix) => {
                    const path = `/${prefix}/${pathPrefix}`;
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

            // Default handling for all other modules
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

          {/* Alias routes for Analytics paths (e.g. /admin/analytics) mapped to Reports module */}
          {ROLE_PREFIXES.map((prefix) => (
            <Route
              element={<ModuleRouteGuard moduleName="Reports & Analytics" />}
              key={`analytics-alias-${prefix}`}
            >
              <Route path={`/${prefix}/analytics`} element={<Report />} />
            </Route>
          ))}

          <Route element={<ModuleRouteGuard moduleName="Clients" />}>
            <Route path="/add-client" element={<AddClient />} />
            <Route path="/client-dashboard/:id" element={<ClientDashboard />} />
          </Route>
          <Route element={<ModuleRouteGuard moduleName="Tasks" />}>
            <Route path="/task/:id" element={<TaskDetails />} />
          </Route>

          {/* Trash */}
          <Route path="/trash" element={<Trash />} />

          {/* Module detail by moduleId */}
          <Route path="/module/:moduleId" element={<ModuleDetail />} />

          {/* Role home pages */}
          <Route path="/home/admin" element={<RoleRoute role="Admin" Component={AdminDashboard} />} />
          <Route path="/home/manager" element={<RoleRoute role="Manager" Component={ManagerDashboard} />} />
          <Route path="/home/employee" element={<RoleRoute role="Employee" Component={EmployeeHome} />} />
          <Route path="/home/client-viewer" element={<RoleRoute role="Client-Viewer" Component={ClientViewerHome} />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/log-in" element={<Login />} />
        {/* legacy route redirect */}
        <Route path="/login" element={<Navigate to="/log-in" replace />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />

        {/* Catch All */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>

      <Toaster richColors />
    </main>
  );
}

export default App;
