import { apiFetch } from './apiClient';
import type { UserRole } from '@/types';

export interface RoleAssignmentPayload {
  userId: string;
  roleName?: string;
  role?: UserRole | string;
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

export const ROLES_API_ENDPOINT = import.meta.env.VITE_ROLES_API_ENDPOINT || '/roles';

function normalizeRoleDefinition(raw: unknown, index: number): SystemRoleDefinition {
  if (typeof raw === 'string') {
    return {
      id: `role-${raw.toLowerCase()}`,
      name: raw,
      code: raw as UserRole,
    };
  }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const code = String(obj.code || obj.name || obj.role_name || `ROLE_${index}`);
    return {
      id: String(obj.id || `role-${code.toLowerCase()}`),
      name: String(obj.name || obj.role_name || code),
      code: code as UserRole,
      description: obj.description ? String(obj.description) : undefined,
      permissions: Array.isArray(obj.permissions) ? obj.permissions.map(String) : undefined,
      userCount: typeof obj.userCount === 'number' ? obj.userCount : undefined,
    };
  }
  return {
    id: `role-${index}`,
    name: `Role ${index}`,
    code: 'GUEST',
  };
}

/**
 * Fetch official system role definitions from GET /roles
 */
export async function getRoles(): Promise<RoleServiceResult<SystemRoleDefinition[]>> {
  const response = await apiFetch<Record<string, unknown> | SystemRoleDefinition[]>(ROLES_API_ENDPOINT, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Unable to connect to role management service.',
    };
  }

  let rawList: unknown[] = [];
  const body = response.data;

  if (Array.isArray(body)) {
    rawList = body;
  } else if (typeof body === 'object' && body !== null) {
    const obj = body as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      rawList = obj.data;
    }
  }

  const roleDefinitions = rawList.map((item, idx) => normalizeRoleDefinition(item, idx));

  return {
    success: true,
    data: roleDefinitions,
  };
}

/**
 * Assign user role via official endpoint: POST /users/{user_id}/roles
 */
export async function assignUserRole(payload: RoleAssignmentPayload): Promise<RoleServiceResult<null>> {
  const userId = payload.userId?.trim();
  const roleName = payload.roleName || payload.role;

  if (!userId || !roleName) {
    return {
      success: false,
      message: 'User ID and role_name are required for role assignment.',
    };
  }

  const endpoint = `/users/${encodeURIComponent(userId)}/roles`;
  const response = await apiFetch<null>(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      role_name: roleName,
    }),
  });

  if (response.error) {
    return {
      success: false,
      message: response.error,
    };
  }

  return {
    success: true,
    message: 'User role assigned successfully.',
  };
}
