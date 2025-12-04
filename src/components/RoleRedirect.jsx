import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const RoleRedirect = () => {
  const user = useSelector((state) => state.auth.user);
  if (!user) return <Navigate to="/log-in" replace />;
  switch (user.role) {
    case 'Admin':
      return <Navigate to="/admin" replace />;
    case 'Manager':
      return <Navigate to="/manager" replace />;
    case 'Employee':
      return <Navigate to="/employee" replace />;
    case 'Client':
      return <Navigate to="/client" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default RoleRedirect;
