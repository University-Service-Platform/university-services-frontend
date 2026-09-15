import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth';
import { LoadingState } from '@/components/ui';
import { UnauthorizedPage } from '@/pages';
import type { UserRole } from '@/types';

export interface ProtectedRouteProps {
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  isPublic?: boolean;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRoles,
  requiredPermissions,
  isPublic = false,
  children,
}) => {
  const { isAuthenticated, isLoading, isAuthorized } = useAuth();

  // 1. Loading state verification
  if (isLoading) {
    return (
      <LoadingState
        title="Verifying Authorization..."
        description="Please wait while your access permissions are checked."
      />
    );
  }

  // 2. Public route check
  if (isPublic) {
    return children ? <>{children}</> : <Outlet />;
  }

  // 3. Unauthenticated access check -> Redirect to /auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // 4. Authorized access check
  const authorized = isAuthorized(requiredRoles, requiredPermissions);

  if (!authorized) {
    return <UnauthorizedPage />;
  }

  return children ? <>{children}</> : <Outlet />;
};
