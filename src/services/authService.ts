import { apiFetch, AUTH_TOKEN_STORAGE_KEY, getStoredAuthToken } from './apiClient';
import type { UserProfile, UserRole, AccountStatus } from '@/types';

export interface LoginCredentials {
  identifier: string;
  password?: string;
  rememberMe?: boolean;
}

export interface BackendLoginData {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  user_id?: string;
  university_id?: string;
  roles?: UserRole[];
}

export interface AuthResponse {
  success?: boolean;
  data?: BackendLoginData;
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
  isInactive?: boolean;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: UserProfile;
  isInactive?: boolean;
}

export const AUTH_LOGIN_API_ENDPOINT = import.meta.env.VITE_AUTH_LOGIN_API_ENDPOINT || '/auth/login';
export const AUTH_ME_API_ENDPOINT = import.meta.env.VITE_AUTH_ME_API_ENDPOINT || '/auth/me';
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
    // Session persistence is best-effort
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
    // Ignore storage cleanup failures
  }
}

export function mapBackendUserToProfile(raw: Record<string, unknown>): UserProfile {
  const id = String(raw.id || raw.user_id || raw.userId || '');
  const email = String(raw.email || '');
  const firstName = String(raw.firstName || raw.first_name || '');
  const lastName = String(raw.lastName || raw.last_name || '');
  const rawRoles = Array.isArray(raw.roles) ? raw.roles : [];
  const roles: UserRole[] = rawRoles.map((r: unknown) => String(r) as UserRole);

  const profile: UserProfile = {
    id,
    email,
    firstName,
    lastName,
    roles,
  };

  if (raw.facultyId || raw.faculty_id) profile.facultyId = String(raw.facultyId || raw.faculty_id);
  if (raw.departmentId || raw.department_id) profile.departmentId = String(raw.departmentId || raw.department_id);
  if (raw.serviceUnitId || raw.service_unit_id) profile.serviceUnitId = String(raw.serviceUnitId || raw.service_unit_id);

  if (raw.facultyName || raw.faculty_name) profile.facultyName = String(raw.facultyName || raw.faculty_name);
  if (raw.departmentName || raw.department_name) profile.departmentName = String(raw.departmentName || raw.department_name);
  if (raw.serviceUnitName || raw.service_unit_name) profile.serviceUnitName = String(raw.serviceUnitName || raw.service_unit_name);

  if (raw.accountStatus || raw.account_status || raw.status) {
    const statusVal = String(raw.accountStatus || raw.account_status || raw.status).toUpperCase();
    if (statusVal === 'ACTIVE' || statusVal === 'INACTIVE') {
      profile.accountStatus = statusVal as AccountStatus;
    }
  }

  if (raw.universityId || raw.university_id) profile.universityId = String(raw.universityId || raw.university_id);
  const accountType = String(raw.accountType || raw.account_type || '').toUpperCase();
  if (accountType === 'STUDENT' || accountType === 'STAFF') profile.accountType = accountType;

  if (raw.phone || raw.phoneNumber || raw.phone_number) {
    profile.phone = String(raw.phone || raw.phoneNumber || raw.phone_number);
  }

  return profile;
}

export async function getCurrentUser(): Promise<AuthResult> {
  const token = getStoredAuthToken();
  if (!token) {
    return {
      success: false,
      message: 'No authentication token found.',
    };
  }

  const response = await apiFetch<Record<string, unknown>>(AUTH_ME_API_ENDPOINT);

  if (response.status === 401) {
    clearAuthSession();
    return {
      success: false,
      message: 'Session expired or invalid. Please log in again.',
    };
  }

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to fetch current user profile.',
    };
  }

  const body = response.data;
  let userData: Record<string, unknown> | undefined;

  if (body && typeof body === 'object') {
    if ('data' in body && body.data && typeof body.data === 'object') {
      userData = body.data as Record<string, unknown>;
    } else if (body.success !== false) {
      userData = body as Record<string, unknown>;
    }
  }

  if (!userData) {
    return {
      success: false,
      message: response.error || 'User identity profile not returned by backend.',
    };
  }

  const user = mapBackendUserToProfile(userData);
  storeAuthSession(user);

  return {
    success: true,
    user,
  };
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  // Drop any previous session first so apiFetch does not attach the old user's Bearer token to the login call.
  clearAuthSession();

  const response = await apiFetch<AuthResponse>(AUTH_LOGIN_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      username: credentials.identifier,
      password: credentials.password,
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

  const body = response.data;
  const loginData: BackendLoginData | undefined =
    body.data || (body as unknown as BackendLoginData);

  const accessToken = loginData?.access_token;

  if (!accessToken) {
    return {
      success: false,
      message: body.error?.message || body.message || 'Authentication failed. Access token not provided by backend.',
    };
  }

  // A new login replaces the whole session, so a previous user's token is never reused.
  clearAuthSession();
  try {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
  } catch {
    // Session storage writing is best-effort
  }

  const meResult = await getCurrentUser();
  if (meResult.success && meResult.user) {
    storeAuthSession(meResult.user, accessToken);
    return {
      success: true,
      user: meResult.user,
    };
  }

  if (loginData.user_id || loginData.roles) {
    const fallbackUser: UserProfile = mapBackendUserToProfile({
      id: loginData.user_id || loginData.university_id || 'user',
      email: credentials.identifier,
      firstName: credentials.identifier,
      lastName: '',
      roles: loginData.roles || ['GUEST'],
    });
    storeAuthSession(fallbackUser, accessToken);
    return {
      success: true,
      user: fallbackUser,
    };
  }

  return {
    success: false,
    message: meResult.message || 'Failed to retrieve user profile after login.',
  };
}
