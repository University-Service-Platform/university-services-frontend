import type { UserProfile, UserRole } from '@/types';

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  roles: UserRole[];
  permissions: string[];
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permissions: string | string[]) => boolean;
  isAuthorized: (requiredRoles?: UserRole[], requiredPermissions?: string[]) => boolean;
  setAuthUser: (user: UserProfile | null) => void;
  logout: () => void;
}
