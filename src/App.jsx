import { Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import { getProfile, selectUser } from "./redux/slices/authSlice";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import TaskDetails from "./pages/TaskDetails";
import Tasks from "./pages/Tasks";
import Report from "./pages/Report";
import TestRep from "./pages/testRep";
import Users from "./pages/Users";
import Client from "./pages/Client";
import Dashboard from "./pages/dashboard";
import AddClient from "./pages/AddClientsP";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import Forgot from "./pages/Forgot";
import Reset from "./pages/Reset";
import ProtectedRoute from "./components/ProtectedRoute";
import ModuleRouteGuard from "./components/ModuleRouteGuard";

import PageNotFound from "./pages/PageNotFound";
import Analysis from "./pages/Analysis";
import Departments from "./pages/Departments";
import Projects from "./pages/Projects";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import Workflow from "./pages/Workflow";
import Notifications from "./pages/Notifications";
import Trash from "./pages/Trash";
import Approvals from "./pages/Approvals";
import LandingPage from "./Landingpage";

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
    if (user && (!user.modules || user.modules.length === 0)) {
      dispatch(getProfile());
    }
  }, []);

  return (
    <main className="w-full min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<Layout />}>
          {/* Dashboard */}
          <Route element={<ModuleRouteGuard moduleName="Dashboard" />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* User Management */}
          <Route element={<ModuleRouteGuard moduleName="User Management" />}>
            <Route path="/team" element={<Users />} />
          </Route>

          {/* Clients */}
          <Route element={<ModuleRouteGuard moduleName="Clients" />}>
            <Route path="/client" element={<Client />} />
            <Route path="/add-client" element={<AddClient />} />
          </Route>

          {/* Departments */}
          <Route element={<ModuleRouteGuard moduleName="Departments" />}>
            <Route path="/departments" element={<Departments />} />
          </Route>

          {/* Tasks */}
          <Route element={<ModuleRouteGuard moduleName="Tasks" />}>
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/task/:id" element={<TaskDetails />} />
          </Route>

          {/* Projects */}
          <Route element={<ModuleRouteGuard moduleName="Projects" />}>
            <Route path="/projects" element={<Projects />} />
          </Route>

          {/* Reports / Analysis */}
          <Route element={<ModuleRouteGuard moduleName="Reports & Analytics" />}>
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/report" element={<Report />} />
            <Route path="/testRep" element={<TestRep />} />
          </Route>

          {/* Documents */}
          <Route element={<ModuleRouteGuard moduleName="Document & File Management" />}>
            <Route path="/documents" element={<Documents />} />
          </Route>

          {/* Settings */}
          <Route element={<ModuleRouteGuard moduleName="Settings & Master Configuration" />}>
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Chat */}
          <Route element={<ModuleRouteGuard moduleName="Chat / Real-Time Collaboration" />}>
            <Route path="/chat" element={<Chat />} />
          </Route>

          {/* Workflow */}
          <Route element={<ModuleRouteGuard moduleName="Workflow (Project & Task Flow)" />}>
            <Route path="/workflow" element={<Workflow />} />
          </Route>

          {/* Notifications */}
          <Route element={<ModuleRouteGuard moduleName="Notifications" />}>
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Approvals */}
          <Route element={<ModuleRouteGuard moduleName="Approval Workflows" />}>
            <Route path="/approvals" element={<Approvals />} />
          </Route>

          {/* Trash */}
          <Route path="/trash" element={<Trash />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/log-in" element={<Login />} />
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
