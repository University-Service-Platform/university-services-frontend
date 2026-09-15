import React, { useState, useCallback, useMemo } from 'react';
import type { UserProfile, UserRole } from '@/types';
import { AuthContext } from './context';
import type { AuthState, AuthContextType } from './types';

const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  roles: [],
  permissions: [],
  isLoading: false,
  error: null,
};

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialAuthState);

  const setAuthUser = useCallback((user: UserProfile | null) => {
    if (!user) {
      setState({
        isAuthenticated: false,
        user: null,
        roles: [],
        permissions: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    const roles: UserRole[] = Array.isArray(user.roles) ? user.roles : [];
    
    setState({
      isAuthenticated: true,
      user,
      roles,
      permissions: [],
      isLoading: false,
      error: null,
    });
  }, []);

  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      user: null,
      roles: [],
      permissions: [],
      isLoading: false,
      error: null,
    });
  }, []);

  const hasRole = useCallback((requiredRoles: UserRole | UserRole[]): boolean => {
    if (!state.isAuthenticated || !state.roles.length) return false;
    const targetRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return targetRoles.some((role) => state.roles.includes(role));
  }, [state.isAuthenticated, state.roles]);

  const hasPermission = useCallback((requiredPermissions: string | string[]): boolean => {
    if (!state.isAuthenticated || !state.permissions.length) return false;
    const targetPermissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    return targetPermissions.some((perm) => state.permissions.includes(perm));
  }, [state.isAuthenticated, state.permissions]);

  const isAuthorized = useCallback((requiredRoles?: UserRole[], requiredPermissions?: string[]): boolean => {
    if (!state.isAuthenticated) return false;
    
    if ((!requiredRoles || requiredRoles.length === 0) && (!requiredPermissions || requiredPermissions.length === 0)) {
      return true;
    }

    let roleAuthorized = true;
    if (requiredRoles && requiredRoles.length > 0) {
      roleAuthorized = hasRole(requiredRoles);
    }

    let permAuthorized = true;
    if (requiredPermissions && requiredPermissions.length > 0) {
      permAuthorized = hasPermission(requiredPermissions);
    }

    return roleAuthorized && permAuthorized;
  }, [state.isAuthenticated, hasRole, hasPermission]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      ...state,
      hasRole,
      hasPermission,
      isAuthorized,
      setAuthUser,
      logout,
    }),
    [state, hasRole, hasPermission, isAuthorized, setAuthUser, logout]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
