import { apiFetch } from './apiClient';
import type {
  Department,
  DepartmentCreatePayload,
  DepartmentUpdatePayload,
  DepartmentServiceResult,
} from '@/types';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend API contract for Department management endpoints is not yet documented in the repository.
 * The endpoint constant below serves as a placeholder integration boundary that will be updated
 * once the official backend OpenAPI/Swagger specification is provided by the backend team.
 */
export const DEPARTMENTS_API_ENDPOINT = import.meta.env.VITE_DEPARTMENTS_API_ENDPOINT || '/departments';

export async function getDepartments(): Promise<DepartmentServiceResult<Department[]>> {
  const response = await apiFetch<Department[]>(DEPARTMENTS_API_ENDPOINT, {
    method: 'GET',
  });

  if (response.error || !Array.isArray(response.data)) {
    return {
      success: false,
      message: response.error || 'Unable to connect to Department Management service. Official backend contract is pending integration.',
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function createDepartment(payload: DepartmentCreatePayload): Promise<DepartmentServiceResult<Department>> {
  const response = await apiFetch<Department>(DEPARTMENTS_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to create department. Unable to connect to backend department service.',
    };
  }

  return {
    success: true,
    data: response.data,
    message: 'Department created successfully.',
  };
}

export async function updateDepartment(id: string, payload: DepartmentUpdatePayload): Promise<DepartmentServiceResult<Department>> {
  const response = await apiFetch<Department>(`${DEPARTMENTS_API_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to update department. Unable to connect to backend department service.',
    };
  }

  return {
    success: true,
    data: response.data,
    message: 'Department updated successfully.',
  };
}

export async function deleteDepartment(id: string): Promise<DepartmentServiceResult<null>> {
  const response = await apiFetch<null>(`${DEPARTMENTS_API_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (response.error) {
    return {
      success: false,
      message: response.error || 'Failed to delete department. Unable to connect to backend department service.',
    };
  }

  return {
    success: true,
    message: 'Department deleted successfully.',
  };
}
