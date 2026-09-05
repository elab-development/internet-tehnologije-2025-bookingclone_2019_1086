import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../features/auth/hooks/useAuth";
import type { Role } from "../../features/auth/types/authTypes";

type ProtectedRouteProps = {
  allowedRoles?: Role[];
  children: ReactElement;
};

export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}