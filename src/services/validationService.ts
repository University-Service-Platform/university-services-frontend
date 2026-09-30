import { apiFetch } from './apiClient';
import type { UserRole, AccountStatus } from '@/types';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * DTO contracts for cross-team identity, account status, and role validation APIs
 * required by external Group 6, 7, and 8 service integrations.
 */

export interface UserValidationRequest {
  userId: string;
  requiredRoles?: UserRole[];
}

export interface UserValidationData {
  valid: boolean;
  userId: string;
  email?: string;
  accountStatus: AccountStatus;
  isAccountActive: boolean;
  roles: UserRole[];
  departmentId?: string;
  facultyId?: string;
  serviceUnitId?: string;
}

export interface ValidationResult {
  success: boolean;
  data?: UserValidationData;
  message?: string;
  status: number;
}

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * Official backend API contract for cross-team validation endpoints is not yet documented in the repository.
 * The endpoint constant below serves as a placeholder integration boundary for external Group 6, 7, and 8 service calls.
 */
export const VALIDATION_API_ENDPOINT = import.meta.env.VITE_VALIDATION_API_ENDPOINT || '/users/validate';

/**
 * Validate user identity, account status, and assigned roles for cross-team service authorization.
 * Used by external groups (Groups 6, 7, and 8) to verify user authenticity without direct database access.
 */
export async function validateUserIdentity(userId: string): Promise<ValidationResult> {
  if (!userId || !userId.trim()) {
    return {
      success: false,
      status: 400,
      message: 'User ID is required for cross-team identity validation.',
    };
  }

  const response = await apiFetch<UserValidationData>(`${VALIDATION_API_ENDPOINT}/${encodeURIComponent(userId.trim())}`, {
    method: 'GET',
  });

  if (response.status === 401) {
    return {
      success: false,
      status: 401,
      message: 'Unauthenticated API access. Consuming service authentication credentials are invalid or missing.',
    };
  }

  if (response.status === 403) {
    return {
      success: false,
      status: 403,
      message: 'Unauthorized API access or user account is currently INACTIVE.',
    };
  }

  if (response.status === 404) {
    return {
      success: false,
      status: 404,
      message: 'Target user identity record not found in university identity directory.',
    };
  }

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status || 500,
      message: response.error || 'Unable to connect to cross-team validation API. Official backend contract is pending integration.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
  };
}

/**
 * Validate whether a user possesses specific required system roles for cross-team service authorization.
 */
export async function validateUserRole(
  userId: string,
  requiredRoles: UserRole | UserRole[]
): Promise<ValidationResult> {
  if (!userId || !userId.trim()) {
    return {
      success: false,
      status: 400,
      message: 'User ID is required for role validation.',
    };
  }

  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  const response = await apiFetch<UserValidationData>(`${VALIDATION_API_ENDPOINT}/roles`, {
    method: 'POST',
    body: JSON.stringify({
      userId: userId.trim(),
      requiredRoles: rolesArray,
    }),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status || 500,
      message: response.error || 'Role validation request failed. Unable to connect to backend validation service.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
  };
}

/**
 * Validate whether a user account status is ACTIVE for cross-team service access.
 */
export async function validateAccountStatus(userId: string): Promise<ValidationResult> {
  if (!userId || !userId.trim()) {
    return {
      success: false,
      status: 400,
      message: 'User ID is required for account status validation.',
    };
  }

  const result = await validateUserIdentity(userId);
  if (!result.success || !result.data) {
    return result;
  }

  const isConfirmedActive = result.data.accountStatus === 'ACTIVE' && result.data.isAccountActive;

  if (!isConfirmedActive) {
    return {
      success: false,
      status: 403,
      data: result.data,
      message: 'Account status validation failed: User account is INACTIVE or restricted.',
    };
  }

  return {
    success: true,
    status: 200,
    data: result.data,
  };
}
