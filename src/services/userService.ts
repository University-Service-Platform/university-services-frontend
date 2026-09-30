import { apiFetch } from './apiClient';
import type { UserProfile } from '@/types';

export interface UserCreatePayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UserUpdatePayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
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

  if (response.error || !Array.isArray(response.data)) {
    return {
      success: false,
      message: response.error || 'Unable to connect to User Management service.',
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function createUser(payload: UserCreatePayload): Promise<UserServiceResult<UserProfile>> {
  const response = await apiFetch<UserProfile>(USERS_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to create user. Unable to connect to backend user service.',
    };
  }

  return {
    success: true,
    data: response.data,
    message: 'User created successfully.',
  };
}

export async function updateUser(id: string, payload: UserUpdatePayload): Promise<UserServiceResult<UserProfile>> {
  const response = await apiFetch<UserProfile>(`${USERS_API_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to update user. Unable to connect to backend user service.',
    };
  }

  return {
    success: true,
    data: response.data,
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
