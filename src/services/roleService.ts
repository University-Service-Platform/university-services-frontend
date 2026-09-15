import { apiFetch } from './apiClient';
import type { UserRole } from '@/types';

export interface RoleAssignmentPayload {
  userId: string;
  role: UserRole;
  departmentId?: string;
  serviceUnitId?: string;
}

export interface SystemRoleDefinition {
  id: string;
  name: string;
  code: UserRole;
  description?: string;
  permissions?: string[];
  userCount?: number;
}

export interface RoleServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * UNCONFIRMED INTEGRATION BOUNDARY:
 * Official backend API contract for role management and user-role assignment endpoints is not yet documented in the repository.
 * The endpoint constants below serve as placeholder integration boundaries that will be updated
 * once the official backend OpenAPI/Swagger specification is provided by the backend team.
 */
export const ROLES_API_ENDPOINT = import.meta.env.VITE_ROLES_API_ENDPOINT || '/roles';
export const ROLE_ASSIGNMENT_API_ENDPOINT = import.meta.env.VITE_ROLE_ASSIGNMENT_API_ENDPOINT || '/roles/assign';

export async function getRoles(): Promise<RoleServiceResult<SystemRoleDefinition[]>> {
  const response = await apiFetch<SystemRoleDefinition[]>(ROLES_API_ENDPOINT, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: 'Unable to connect to role management service. Backend API contract is pending integration.',
    };
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function assignUserRole(payload: RoleAssignmentPayload): Promise<RoleServiceResult<null>> {
  const response = await apiFetch<null>(ROLE_ASSIGNMENT_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.error) {
    return {
      success: false,
      message: response.error || 'Failed to assign role. Unable to connect to backend role service.',
    };
  }

  return {
    success: true,
    message: 'User role assigned successfully.',
  };
}
