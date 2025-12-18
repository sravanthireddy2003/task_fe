import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { selectUser } from "../redux/slices/authSlice";

const normalize = (s) => (s || "").toString().toLowerCase().replace(/\s|-/g, "");

const RoleRoute = ({ role, Component }) => {
  const user = useSelector(selectUser);

  if (!user) return <Navigate to="/log-in" replace />;

  if (normalize(user.role) !== normalize(role)) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Access denied</h2>
        <p className="text-sm text-gray-500">This page is for <strong>{role}</strong> users only.</p>
      </div>
    );
  }

  return Component ? <Component /> : null;
};

export default RoleRoute;
