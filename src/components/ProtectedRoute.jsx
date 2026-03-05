import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

// props: allowedRoles = ['Admin','Manager']
const ProtectedRoute = ({ allowedRoles }) => {
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to="/log-in" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const has = allowedRoles.includes(user.role);
    if (!has) {
      // redirect to role-specific dashboard
      switch (user.role) {
        case 'Admin':
          return <Navigate to="/admin" replace />;
        case 'Manager':
          return <Navigate to="/manager" replace />;
        case 'Employee':
          return <Navigate to="/employee" replace />;
        case 'Client':
          return <Navigate to="/clients" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
