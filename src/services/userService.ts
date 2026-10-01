import { apiFetch, unwrapData, unwrapList } from './apiClient';
import { mapBackendUserToProfile } from './authService';
import type { AccountType, UserProfile } from '@/types';

export interface UserCreatePayload {
  universityId: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: AccountType;
  /** Without one the account can't sign in until an administrator sets a password. */
  password?: string;
}

export interface UserUpdatePayload {
  firstName: string;
  lastName: string;
  email?: string;
  accountType?: AccountType;
}

/** The Identity Service stores one full name. */
function fullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
}

export interface UserServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export const USERS_API_ENDPOINT = import.meta.env.VITE_USERS_API_ENDPOINT || '/users';

export async function getUsers(): Promise<UserServiceResult<UserProfile[]>> {
  const response = await apiFetch<UserProfile[]>(USERS_API_ENDPOINT, {
    method: 'GET',
  });

  const list = unwrapList(response.data);
  if (response.error || !list) {
    return {
      success: false,
      message: response.error || 'Unable to load users right now. Please try again in a moment.',
    };
  }

  return {
    success: true,
    data: list.map(mapBackendUserToProfile),
  };
}

export async function createUser(payload: UserCreatePayload): Promise<UserServiceResult<UserProfile>> {
  const response = await apiFetch<UserProfile>(USERS_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      university_id: payload.universityId.trim(),
      name: fullName(payload.firstName, payload.lastName),
      email: payload.email.trim(),
      account_type: payload.accountType,
      password: payload.password || undefined,
    }),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to create user. Unable to connect to backend user service.',
    };
  }

  return {
    success: true,
    data: mapBackendUserToProfile(unwrapData<Record<string, unknown>>(response.data) ?? {}),
    message: 'User created successfully.',
  };
}

export async function updateUser(id: string, payload: UserUpdatePayload): Promise<UserServiceResult<UserProfile>> {
  const response = await apiFetch<UserProfile>(`${USERS_API_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: fullName(payload.firstName, payload.lastName),
      email: payload.email?.trim() || undefined,
      account_type: payload.accountType,
    }),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to update user. Unable to connect to backend user service.',
    };
  }

  return {
    success: true,
    data: mapBackendUserToProfile(unwrapData<Record<string, unknown>>(response.data) ?? {}),
    message: 'User updated successfully.',
  };
}

export async function deleteUser(id: string): Promise<UserServiceResult<null>> {
  const response = await apiFetch<null>(`${USERS_API_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (response.error) {
    return {
      success: false,
      message: response.error || 'Failed to delete user. Unable to connect to backend user service.',
    };
  }

  return {
    success: true,
    message: 'User deleted successfully.',
  };
}
