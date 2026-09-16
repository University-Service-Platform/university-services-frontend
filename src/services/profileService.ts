import { apiFetch } from './apiClient';
import type { UserProfile } from '@/types';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * Permitted profile update request payload structure. Restricted strictly to permitted editable fields.
 */
export interface ProfileUpdatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * Service response wrapper for profile operations.
 */
export interface ProfileServiceResult<T = UserProfile> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * Official backend API contract for profile endpoints is not yet documented in the repository.
 * The endpoint path below serves as a placeholder integration boundary that will be updated
 * once the official backend OpenAPI/Swagger specification is provided.
 */
export const PROFILE_API_ENDPOINT = import.meta.env.VITE_PROFILE_API_ENDPOINT || '/users/profile';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * Fetch authenticated user profile details from backend endpoint boundary.
 */
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

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * Submit permitted profile information updates to backend endpoint boundary.
 */
export async function updateProfile(payload: ProfileUpdatePayload): Promise<ProfileServiceResult<UserProfile>> {
  // Sanitize payload: Ensure ONLY permitted editable fields are dispatched to backend API
  const sanitizedPayload: ProfileUpdatePayload = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone,
  };

  const response = await apiFetch<UserProfile>(PROFILE_API_ENDPOINT, {
    method: 'PUT',
    body: JSON.stringify(sanitizedPayload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to update profile. Unable to connect to backend profile service.',
    };
  }

  return {
    success: true,
    data: response.data,
    message: 'Profile updated successfully.',
  };
}

