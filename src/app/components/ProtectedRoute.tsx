import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../store/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

/**
 * ProtectedRoute wrapper component
 * Checks user authentication and role/permission requirements
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackPath = "/login",
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, hasRole, hasPermission } = useAuth();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated || !user) {
      navigate(fallbackPath);
      return;
    }

    // Check role requirements
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) => hasRole(role));
      if (!hasRequiredRole) {
        navigate("/unauthorized", { replace: true });
        return;
      }
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((perm) =>
        hasPermission(perm),
      );
      if (!hasAllPermissions) {
        navigate("/unauthorized", { replace: true });
        return;
      }
    }
  }, [
    user,
    isAuthenticated,
    requiredRoles,
    requiredPermissions,
    navigate,
    hasRole,
    hasPermission,
    fallbackPath,
  ]);

  // Show loading state while checking auth
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
