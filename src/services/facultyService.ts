import { apiFetch } from './apiClient';
import type { Faculty } from '@/types';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Faculty DTO payloads are not yet documented in the repository.
 * The payload structures below represent an unconfirmed integration boundary subject to change.
 */
export interface FacultyCreatePayload {
  name: string;
  code: string;
  description?: string;
}

export interface FacultyUpdatePayload {
  name?: string;
  code?: string;
  description?: string;
}

export interface FacultyServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend API contract for Faculty management endpoints is not yet documented in the repository.
 * The endpoint constant below serves as a placeholder integration boundary that will be updated
 * once the official backend OpenAPI/Swagger specification is provided by the backend team.
 */
export const FACULTIES_API_ENDPOINT = import.meta.env.VITE_FACULTIES_API_ENDPOINT || '/faculties';

export async function getFaculties(): Promise<FacultyServiceResult<Faculty[]>> {
  const response = await apiFetch<Faculty[]>(FACULTIES_API_ENDPOINT, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: 'Unable to connect to Faculty Management service. Official backend contract is pending integration.',
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function createFaculty(payload: FacultyCreatePayload): Promise<FacultyServiceResult<Faculty>> {
  const response = await apiFetch<Faculty>(FACULTIES_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to create faculty. Unable to connect to backend faculty service.',
    };
  }

  return {
    success: true,
    data: response.data,
    message: 'Faculty created successfully.',
  };
}

export async function updateFaculty(id: string, payload: FacultyUpdatePayload): Promise<FacultyServiceResult<Faculty>> {
  const response = await apiFetch<Faculty>(`${FACULTIES_API_ENDPOINT}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to update faculty. Unable to connect to backend faculty service.',
    };
  }

  return {
    success: true,
    data: response.data,
    message: 'Faculty updated successfully.',
  };
}

export async function deleteFaculty(id: string): Promise<FacultyServiceResult<null>> {
  const response = await apiFetch<null>(`${FACULTIES_API_ENDPOINT}/${id}`, {
    method: 'DELETE',
  });

  if (response.error) {
    return {
      success: false,
      message: response.error || 'Failed to delete faculty. Unable to connect to backend faculty service.',
    };
  }

  return {
    success: true,
    message: 'Faculty deleted successfully.',
  };
}
