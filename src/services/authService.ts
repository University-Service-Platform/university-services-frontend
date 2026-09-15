import { apiFetch } from './apiClient';
import type { UserProfile } from '@/types';

export interface LoginCredentials {
  identifier: string;
  password?: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
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

/**
 * Clean authentication service interface connecting to backend API endpoint.
 * Isolated boundary for authentication operations.
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  const response = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: credentials.identifier,
      password: credentials.password,
      rememberMe: credentials.rememberMe ?? false,
    }),
  });

  // Handle explicit API HTTP status codes safely
  if (response.status === 401) {
    return {
      success: false,
      message: 'Invalid University ID/Email or password. Please check your credentials and try again.',
    };
  }

  if (response.status === 403 || response.data?.isInactive) {
    return {
      success: false,
      isInactive: true,
      message: 'Your account is currently inactive. Please contact the IT Support Helpdesk for assistance.',
    };
  }

  if (response.error || !response.data) {
    return {
      success: false,
      message: 'Unable to connect to authentication service. Please verify system connection or contact IT Support.',
    };
  }

  if (response.data.success && response.data.user) {
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
