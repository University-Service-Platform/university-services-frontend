import { apiFetch } from './apiClient';
import type { UserProfile } from '@/types';

export interface ProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface ProfileServiceResult<T = UserProfile> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * UNCONFIRMED INTEGRATION BOUNDARY:
 * Official backend API contract for profile endpoints is not yet documented in the repository.
 * The endpoint path below serves as a placeholder integration boundary that will be updated
 * once the official backend OpenAPI/Swagger specification is provided.
 */
export const PROFILE_API_ENDPOINT = import.meta.env.VITE_PROFILE_API_ENDPOINT || '/users/profile';

export async function getProfile(): Promise<ProfileServiceResult<UserProfile>> {
  const response = await apiFetch<UserProfile>(PROFILE_API_ENDPOINT, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: 'Unable to connect to profile service. Official backend API contract is pending integration.',
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<ProfileServiceResult<UserProfile>> {
  const response = await apiFetch<UserProfile>(PROFILE_API_ENDPOINT, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: 'Failed to update profile. Unable to connect to backend profile service.',
    };
  }

  return {
    success: true,
    data: response.data,
    message: 'Profile updated successfully.',
  };
}
