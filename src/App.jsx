import { Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
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
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import Forgot from "./pages/Forgot";
import Reset from "./pages/Reset";
import RoleRedirect from "./components/RoleRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import { setOpenSidebar } from "./redux/slices/authSlice";
import { selectTasks } from "./redux/slices/taskSlice";
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
import { GoogleOAuthProvider } from "@react-oauth/google";

function Layout() {
  const location = useLocation();
  const { user, isSidebarCollapsed } = useSelector((state) => state.auth);

  return user ? (
    <div className="w-full h-screen flex flex-row bg-gray-50">
      {/* Desktop Sidebar - Hover-based collapse/expand */}
      <div
        className={clsx(
          "h-screen bg-white border-r border-gray-200 hidden md:block sticky top-0 z-40 transition-all duration-200 group",
          isSidebarCollapsed ? "w-16 group-hover:w-64" : "w-64"
        )}
      >
        <Sidebar />
      </div>
      {/* Main content - flex-1 takes all remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-4 2xl:px-10">
          <Outlet />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <MobileSidebar />
    </div>
  ) : (
    <Navigate to="/log-in" state={{ from: location }} replace />
  );
}

const MobileSidebar = () => {
  const { isSidebarOpen } = useSelector((state) => state.auth);
  const mobileMenuRef = useRef(null);
  const dispatch = useDispatch();

  const closeSidebar = () => {
    dispatch(setOpenSidebar(false));
  };

  return (
    <>
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
        {(ref) => (
          <div
            ref={(node) => (mobileMenuRef.current = node)}
            className="md:hidden fixed inset-0 bg-black/50 z-50 flex"
            onClick={closeSidebar}
          >
            <div 
              className="bg-white w-80 h-full shadow-2xl transform transition-transform duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <img src="/nmit.png" alt="Logo" className="h-10 w-12 rounded-lg shadow-sm" />
                  <span className="text-xl font-semibold text-gray-900">Task Manager</span>
                </div>
                <button
                  onClick={closeSidebar}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  <IoClose size={24} className="text-gray-600" />
                </button>
              </div>

              {/* Mobile Sidebar Content */}
              <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
                <Sidebar />
              </div>
            </div>
          </div>
        )}
      </Transition>
    </>
  );
};

function App() {
  const GoogleAuthWrapper = () => {
    return (
      <GoogleOAuthProvider clientId="1050244552283-mqheend1fvhoguv0b9vuf3t1pp5o9fgv.apps.googleusercontent.com">
        <Login />
      </GoogleOAuthProvider>
    );
  };

  return (
    <main className="w-full min-h-screen bg-gray-50">
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Authenticated layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
            <Route path="/manager" element={<ManagerDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['Employee']} />}>
            <Route path="/employee" element={<EmployeeDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['Client']} />}>
            <Route path="/client-portal" element={<ClientDashboard />} />
          </Route>

          {/* Common routes */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/client" element={<Client />} />
          <Route path="/add-client" element={<AddClient />} />
          <Route path="/client-dashboard/:id" element={<ClientDashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/completed/:status" element={<Tasks />} />
          <Route path="/in-progress/:status" element={<Tasks />} />
          <Route path="/todo/:status" element={<Tasks />} />
          <Route path="/team" element={<Users />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/workflow" element={<Workflow />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/report" element={<Report />} />
          <Route path="/testRep" element={<TestRep />} />
          <Route path="/task/:id" element={<TaskDetails />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>

        {/* Authentication routes */}
        <Route path="/log-in" element={<GoogleAuthWrapper />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />
      </Routes>

      <Toaster richColors />
    </main>
  );
}

export default App;
