import React, { useState, useCallback, useMemo } from 'react';
import type { UserProfile, UserRole, AccountStatus } from '@/types';
import { AuthContext } from './context';
import type { AuthState, AuthContextType } from './types';
import { clearAuthSession, getStoredAuthSession, storeAuthSession } from '@/services/authService';

const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  roles: [],
  permissions: [],
  accountStatus: null,
  isAccountActive: false,
  isAccountInactive: false,
  isLoading: false,
  error: null,
};

export interface AuthProviderProps {
  children: React.ReactNode;
}

function buildAuthenticatedState(user: UserProfile): AuthState {
  const roles: UserRole[] = Array.isArray(user.roles) ? user.roles : [];
  const status: AccountStatus | undefined = user.accountStatus;
  const isConfirmedActive = status === 'ACTIVE';

  return {
    isAuthenticated: true,
    user,
    roles,
    permissions: [],
    accountStatus: status || null,
    isAccountActive: isConfirmedActive,
    isAccountInactive: !isConfirmedActive,
    isLoading: false,
    error: null,
  };
}

// Restore the session persisted by authService so a page reload keeps the user signed in.
function getInitialAuthState(): AuthState {
  const storedSession = getStoredAuthSession();
  return storedSession ? buildAuthenticatedState(storedSession.user) : initialAuthState;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(getInitialAuthState);

  const setAuthUser = useCallback((user: UserProfile | null) => {
    if (!user) {
      clearAuthSession();
      setState(initialAuthState);
      return;
    }

    storeAuthSession(user);
    setState(buildAuthenticatedState(user));
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setState(initialAuthState);
  }, []);

  const hasRole = useCallback((requiredRoles: UserRole | UserRole[]): boolean => {
    if (!state.isAuthenticated || state.isAccountInactive || !state.roles.length) return false;
    const targetRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return targetRoles.some((role) => state.roles.includes(role));
  }, [state.isAuthenticated, state.isAccountInactive, state.roles]);

  const hasPermission = useCallback((requiredPermissions: string | string[]): boolean => {
    if (!state.isAuthenticated || state.isAccountInactive || !state.permissions.length) return false;
    const targetPermissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    return targetPermissions.some((perm) => state.permissions.includes(perm));
  }, [state.isAuthenticated, state.isAccountInactive, state.permissions]);

  const isAuthorized = useCallback((requiredRoles?: UserRole[], requiredPermissions?: string[]): boolean => {
    if (!state.isAuthenticated || state.isAccountInactive) return false;
    
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
  }, [state.isAuthenticated, state.isAccountInactive, hasRole, hasPermission]);

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
