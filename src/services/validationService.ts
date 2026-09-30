import { apiFetch } from './apiClient';
import type { UserRole, AccountStatus } from '@/types';

/**
 * Confirmed by docs/CROSS_TEAM_VALIDATION_API.md and
 * docs/openapi-cross-team-validation.yaml.
 *
 * These endpoints are the Group 5 cross-service validation boundary. External
 * services must use these APIs rather than accessing Group 5 identity data directly.
 *
 * Confirmed operations used here:
 *   GET  /users/validate/{userId}        (validateUserIdentity)
 *   POST /users/validate/roles           (validateUserRole)
 *   GET  /users/account-status/{userId}  (validateAccountStatus)
 *
 * Authentication: the published contract accepts `Authorization: Bearer <token>` or
 * `X-Service-Api-Key`. The browser only sends the Bearer token attached by apiFetch;
 * a service API key is a server-side secret and is never sent from the frontend.
 *
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * Service responsibility validation (system role + department/service-unit
 * responsibility) is not part of the published contract above. docs/group8/consumed-contracts.md
 * records a different Group 5 eligibility endpoint (/validation/users/{user_id}/eligibility)
 * whose source document is not in this repository and whose open points are not agreed,
 * so it is intentionally not implemented here.
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
  /** Present in the published role-validation example; optional because the OpenAPI schema does not declare it. */
  isRoleAuthorized?: boolean;
}

export interface AccountStatusValidationData {
  userId: string;
  accountStatus: AccountStatus;
  isInactive: boolean;
}

export interface ValidationResult<T = UserValidationData> {
  success: boolean;
  data?: T;
  message?: string;
  status: number;
}

export const VALIDATION_API_ENDPOINT =
  import.meta.env.VITE_VALIDATION_API_ENDPOINT || '/users/validate';

export const ACCOUNT_STATUS_VALIDATION_API_ENDPOINT =
  import.meta.env.VITE_ACCOUNT_STATUS_VALIDATION_API_ENDPOINT || '/users/account-status';

function invalidUserIdMessage(): string {
  return 'User ID is required for cross-team validation.';
}

function normalizeUserId(userId: string): string | null {
  const normalized = typeof userId === 'string' ? userId.trim() : '';
  return normalized ? normalized : null;
}

// Identical validation requests already in flight share one backend call.
const inFlightValidations = new Map<string, Promise<unknown>>();

function dedupeValidation<T>(key: string, request: () => Promise<T>): Promise<T> {
  const existing = inFlightValidations.get(key);
  if (existing) return existing as Promise<T>;

  const pending = request().finally(() => {
    inFlightValidations.delete(key);
  });
  inFlightValidations.set(key, pending);
  return pending;
}

/**
 * Validate user identity, account status, roles, and organizational scope.
 *
 * The departmentId, facultyId, and serviceUnitId values are returned by the
 * official identity-validation contract. No additional organizational rules
 * are assumed on the frontend.
 */
export async function validateUserIdentity(userId: string): Promise<ValidationResult<UserValidationData>> {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId) {
    return {
      success: false,
      status: 400,
      message: 'User ID is required for cross-team identity validation.',
    };
  }

  const endpoint = `${VALIDATION_API_ENDPOINT}/${encodeURIComponent(normalizedUserId)}`;
  const response = await dedupeValidation(`GET ${endpoint}`, () =>
    apiFetch<UserValidationData>(endpoint, { method: 'GET' })
  );

  if (response.status === 400) {
    return {
      success: false,
      status: 400,
      message: response.error || 'Invalid user ID for cross-team identity validation.',
    };
  }

  if (response.status === 401) {
    return {
      success: false,
      status: 401,
      message: response.error || 'Unauthenticated API access. Consuming service credentials are invalid or missing.',
    };
  }

  if (response.status === 403) {
    return {
      success: false,
      status: 403,
      message: response.error || 'User account is inactive or access to identity validation was denied.',
      data: response.data,
    };
  }

  if (response.status === 404) {
    return {
      success: false,
      status: 404,
      message: response.error || 'Target user identity record was not found in the university identity directory.',
    };
  }

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status || 500,
      message: response.error || 'Unable to connect to the cross-team validation API.',
    };
  }

  if (!response.data.valid || !response.data.isAccountActive || response.data.accountStatus !== 'ACTIVE') {
    return {
      success: false,
      status: response.status || 403,
      data: response.data,
      message: 'User identity validation failed because the account is not active or valid.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
  };
}

/**
 * Validate whether a user possesses one or more required system roles.
 *
 * Role values are limited to the UserRole values already defined by the
 * frontend and the published Group 5 contract.
 */
export async function validateUserRole(
  userId: string,
  requiredRoles: UserRole | UserRole[]
): Promise<ValidationResult<UserValidationData>> {
  const normalizedUserId = normalizeUserId(userId);
  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  if (!normalizedUserId) {
    return {
      success: false,
      status: 400,
      message: 'User ID is required for role validation.',
    };
  }

  if (rolesArray.length === 0) {
    return {
      success: false,
      status: 400,
      message: 'At least one required role is needed for role validation.',
    };
  }

  const body = JSON.stringify({
    userId: normalizedUserId,
    requiredRoles: rolesArray,
  });
  const response = await dedupeValidation(`POST ${VALIDATION_API_ENDPOINT}/roles ${body}`, () =>
    apiFetch<UserValidationData>(`${VALIDATION_API_ENDPOINT}/roles`, {
      method: 'POST',
      body,
    })
  );

  if (response.status === 400) {
    return {
      success: false,
      status: 400,
      message: response.error || 'Invalid role validation request.',
    };
  }

  if (response.status === 401) {
    return {
      success: false,
      status: 401,
      message: response.error || 'Unauthenticated API access. Consuming service credentials are invalid or missing.',
    };
  }

  if (response.status === 403) {
    return {
      success: false,
      status: 403,
      data: response.data,
      message: response.error || 'User does not possess the required role(s) or the account is inactive.',
    };
  }

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status || 500,
      message: response.error || 'Role validation request failed. Unable to connect to the backend validation service.',
    };
  }

  // The contract answers inactive accounts with 403; a 200 body reporting an inactive
  // account is still treated as a failure rather than silently authorized.
  if (response.data.isAccountActive === false || (response.data.accountStatus && response.data.accountStatus !== 'ACTIVE')) {
    return {
      success: false,
      status: response.status || 403,
      data: response.data,
      message: 'Role validation failed because the user account is not active.',
    };
  }

  const roleAuthorized = response.data.isRoleAuthorized ?? response.data.valid;
  if (!roleAuthorized) {
    return {
      success: false,
      status: response.status || 403,
      data: response.data,
      message: 'Role validation failed. The user does not satisfy the required role(s).',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
  };
}

export interface UserAffiliationExpectation {
  facultyId?: string;
  departmentId?: string;
  serviceUnitId?: string;
}

/**
 * Validate optional affiliation references against the identity data returned by
 * the official validation endpoint. No affiliation is required unless the caller
 * explicitly provides an expected value.
 */
export async function validateUserAffiliation(
  userId: string,
  expected: UserAffiliationExpectation
): Promise<ValidationResult<UserValidationData>> {
  const identityResult = await validateUserIdentity(userId);

  if (!identityResult.success || !identityResult.data) {
    return identityResult;
  }

  const actual = identityResult.data;
  const mismatches: string[] = [];

  if (expected.facultyId && actual.facultyId !== expected.facultyId) {
    mismatches.push('faculty affiliation');
  }

  if (expected.departmentId && actual.departmentId !== expected.departmentId) {
    mismatches.push('department affiliation');
  }

  if (expected.serviceUnitId && actual.serviceUnitId !== expected.serviceUnitId) {
    mismatches.push('service unit affiliation');
  }

  if (mismatches.length > 0) {
    return {
      success: false,
      status: 403,
      data: actual,
      message: `User affiliation validation failed for ${mismatches.join(', ')}.`,
    };
  }

  return identityResult;
}


/**
 * Verify account activation using the dedicated published account-status endpoint.
 */
export async function validateAccountStatus(
  userId: string
): Promise<ValidationResult<AccountStatusValidationData>> {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId) {
    return {
      success: false,
      status: 400,
      message: invalidUserIdMessage(),
    };
  }

  const endpoint = `${ACCOUNT_STATUS_VALIDATION_API_ENDPOINT}/${encodeURIComponent(normalizedUserId)}`;
  const response = await dedupeValidation(`GET ${endpoint}`, () =>
    apiFetch<AccountStatusValidationData>(endpoint, { method: 'GET' })
  );

  if (response.status === 400) {
    return {
      success: false,
      status: 400,
      message: response.error || 'Invalid user ID for account status validation.',
    };
  }

  if (response.status === 401) {
    return {
      success: false,
      status: 401,
      message: response.error || 'Unauthenticated API access. Consuming service credentials are invalid or missing.',
    };
  }

  if (response.status === 403) {
    return {
      success: false,
      status: 403,
      data: response.data,
      message: response.error || 'Account status validation was denied because the account is inactive.',
    };
  }

  if (response.status === 404) {
    return {
      success: false,
      status: 404,
      message: response.error || 'Target user identity record was not found in the university identity directory.',
    };
  }

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status || 500,
      message: response.error || 'Unable to connect to account status verification service.',
    };
  }

  if (response.data.accountStatus !== 'ACTIVE' || response.data.isInactive) {
    return {
      success: false,
      status: response.status || 403,
      data: response.data,
      message: 'Account status validation failed: the user account is INACTIVE.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
  };
}
