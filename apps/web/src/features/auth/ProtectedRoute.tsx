import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { AdminRole } from "../../lib/api/types";
import { useAuth } from "./AuthContext";
import { isRoleAllowed } from "./rbac";

type ProtectedRouteProps = {
  allowedRoles?: AdminRole[];
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps = {}) => {
  const { admin, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !isRoleAllowed(admin?.role, allowedRoles)) {
    return <Navigate to="/admin/orders" replace />;
  }

  return <Outlet />;
};
