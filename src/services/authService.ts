import { apiFetch, AUTH_TOKEN_STORAGE_KEY } from './apiClient';
import type { UserProfile } from '@/types';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY TYPES PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend authentication DTO schemas (request body, response body, token format)
 * are not yet documented in the repository. These types preserve the existing integration boundary.
 */
export interface LoginCredentials {
  identifier: string;
  password?: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  user?: UserProfile;
  token?: string;
  isInactive?: boolean;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: UserProfile;
  isInactive?: boolean;
}

export const AUTH_LOGIN_API_ENDPOINT = import.meta.env.VITE_AUTH_LOGIN_API_ENDPOINT || '/auth/login';
export const AUTH_USER_STORAGE_KEY = 'university-services.auth.user';

export interface StoredAuthSession {
  user: UserProfile;
}

export function storeAuthSession(user: UserProfile, token?: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));

    if (token) {
      sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // Session persistence is best-effort; authentication state still remains in memory.
  }
}

export function getStoredAuthSession(): StoredAuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawUser = sessionStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!rawUser) return null;

    const user = JSON.parse(rawUser) as UserProfile;
    if (!user || typeof user.id !== 'string' || !Array.isArray(user.roles)) {
      return null;
    }

    return { user };
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures; in-memory logout still succeeds.
  }
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  const response = await apiFetch<AuthResponse>(AUTH_LOGIN_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      username: credentials.identifier,
      password: credentials.password,
      rememberMe: credentials.rememberMe ?? false,
    }),
  });

  if (response.status === 401) {
    clearAuthSession();
    return {
      success: false,
      message: 'Invalid University ID/Email or password. Please check your credentials and try again.',
    };
  }

  if (response.status === 403 || response.data?.isInactive) {
    clearAuthSession();
    return {
      success: false,
      isInactive: true,
      message: 'Your account is currently inactive. Please contact the IT Support Helpdesk for assistance.',
    };
  }

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Unable to connect to authentication service. Please verify system connection or contact IT Support.',
    };
  }

  if (response.data.success && response.data.user) {
    // A new login replaces the whole session, so a previous user's token is never reused.
    clearAuthSession();
    storeAuthSession(response.data.user, response.data.token);

    return {
      success: true,
      user: response.data.user,
    };
  }

  return {
    success: false,
    message: response.data.message || 'Authentication failed. Please check your credentials.',
  };
}
