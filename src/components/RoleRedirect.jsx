import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { getDefaultLandingPath } from '../utils';

const RoleRedirect = () => {
  const user = useSelector((state) => state.auth.user);

  if (!user) return <Navigate to="/log-in" replace />;

  const target = getDefaultLandingPath(user);
  return <Navigate to={target} replace />;
};

export default RoleRedirect;
