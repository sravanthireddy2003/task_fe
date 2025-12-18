import React from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/slices/authSlice";
import AdminDashboard from "../pages/AdminDashboard";
import ManagerDashboard from "../pages/ManagerDashboard";
import EmployeeDashboard from "../pages/EmployeeDashboard";
import EmployeeHome from "../pages/EmployeeHome";
import ClientViewerHome from "../pages/ClientViewerHome";

const normalize = (s) => (s || "").toString().toLowerCase().replace(/\s|-/g, "");

const DashboardRouter = () => {
  const user = useSelector(selectUser);
  const role = normalize(user?.role);

  switch (role) {
    case "admin":
      return <AdminDashboard />;
    case "manager":
      return <ManagerDashboard />;
    case "employee":
      // show a compact employee-centric dashboard
      return <EmployeeDashboard />;
    case "clientviewer":
    case "client":
      return <ClientViewerHome />;
    default:
      return <EmployeeHome />;
  }
};

export default DashboardRouter;
