import { apiFetch } from './apiClient';
import type { Department } from '@/types';

export interface DepartmentCreatePayload {
  name: string;
  code: string;
  facultyId: string;
  description?: string;
}

export interface DepartmentUpdatePayload {
  name?: string;
  code?: string;
  facultyId?: string;
  description?: string;
}

export interface DepartmentServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export const DEPARTMENTS_API_ENDPOINT = import.meta.env.VITE_DEPARTMENTS_API_ENDPOINT || '/departments';

export async function getDepartments(facultyId?: string): Promise<DepartmentServiceResult<Department[]>> {
  const endpoint = facultyId ? `${DEPARTMENTS_API_ENDPOINT}?facultyId=${encodeURIComponent(facultyId)}` : DEPARTMENTS_API_ENDPOINT;
  const response = await apiFetch<Department[]>(endpoint, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: 'Unable to connect to Department Management service. Official backend contract is pending integration.',
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
  const response = await apiFetch<Department>(`${DEPARTMENTS_API_ENDPOINT}/${id}`, {
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
  const response = await apiFetch<null>(`${DEPARTMENTS_API_ENDPOINT}/${id}`, {
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
