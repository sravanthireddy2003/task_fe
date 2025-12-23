import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function ModuleRouteGuard({ moduleName }) {
  const { user } = useSelector((state) => state.auth);

  if (!user || !user.modules) return <Navigate to="/log-in" replace />;

  const moduleNames = Array.isArray(moduleName) ? moduleName : [moduleName];
  const hasAccess = moduleNames.some((name) => user.modules.some((m) => m.name === name));

  return hasAccess ? <Outlet /> : <Navigate to="/404" replace />;
}
