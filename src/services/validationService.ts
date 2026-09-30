import { apiFetch, type ApiResponse } from './apiClient';
import type { UserRole, AccountStatus } from '@/types';

export interface UserValidationData {
  valid: boolean;
  userId: string;
  email?: string;
  accountStatus?: AccountStatus;
  isAccountActive?: boolean;
  roles?: UserRole[];
  departmentId?: string;
  facultyId?: string;
  serviceUnitId?: string;
  isRoleAuthorized?: boolean;
}

export interface AccountStatusValidationData {
  userId: string;
  accountStatus: AccountStatus;
  isInactive: boolean;
}

export interface DepartmentValidationData {
  valid: boolean;
  departmentId: string;
  name?: string;
  facultyId?: string;
}

export interface FacultyValidationData {
  valid: boolean;
  facultyId: string;
  name?: string;
}

export interface ServiceUnitValidationData {
  valid: boolean;
  unitId: string;
  name?: string;
}

export interface UserAffiliationValidationData {
  valid: boolean;
  userId: string;
  facultyId?: string;
  departmentId?: string;
  serviceUnitId?: string;
}

export interface UserResponsibilitiesValidationData {
  valid: boolean;
  userId: string;
  responsibilities?: string[] | Record<string, unknown>[];
}

export interface UserAffiliationExpectation {
  facultyId?: string;
  departmentId?: string;
  serviceUnitId?: string;
}

export interface ValidationResult<T = UserValidationData> {
  success: boolean;
  data?: T;
  message?: string;
  status: number;
}

function normalizeUserId(userId: string): string | null {
  const normalized = typeof userId === 'string' ? userId.trim() : '';
  return normalized ? normalized : null;
}

// In-flight validation request deduplication map
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

const UNAUTHENTICATED_MESSAGE =
  'Unauthenticated API access. Consuming service credentials are invalid or missing.';

interface FailureMessages {
  badRequest: string;
  forbidden: string;
  notFound?: string;
  unavailable: string;
}

type HttpOutcome<TTarget> =
  | { data: Record<string, unknown>; failure?: undefined }
  | { data?: undefined; failure: ValidationResult<TTarget> };

function mapHttpOutcome<TTarget>(
  response: ApiResponse<Record<string, unknown>>,
  messages: FailureMessages
): HttpOutcome<TTarget> {
  if (response.status === 400) {
    return { failure: { success: false, status: 400, message: response.error || messages.badRequest } };
  }

  if (response.status === 401) {
    return { failure: { success: false, status: 401, message: response.error || UNAUTHENTICATED_MESSAGE } };
  }

  if (response.status === 403) {
    return {
      failure: { success: false, status: 403, message: response.error || messages.forbidden },
    };
  }

  if (response.status === 404 && messages.notFound) {
    return { failure: { success: false, status: 404, message: response.error || messages.notFound } };
  }

  if (response.error || !response.data) {
    return {
      failure: { success: false, status: response.status || 500, message: response.error || messages.unavailable },
    };
  }

  return { data: response.data };
}

/**
 * Official Identity Validation endpoint:
 * GET /validation/users/{user_id}?required_role=...
 */
export async function validateUserIdentity(
  userId: string,
  requiredRole?: string
): Promise<ValidationResult<UserValidationData>> {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId) {
    return {
      success: false,
      status: 400,
      message: 'User ID is required for identity validation.',
    };
  }

  const query = requiredRole ? `?required_role=${encodeURIComponent(requiredRole)}` : '';
  const endpoint = `/validation/users/${encodeURIComponent(normalizedUserId)}${query}`;

  const response = await dedupeValidation(`GET ${endpoint}`, () =>
    apiFetch<Record<string, unknown>>(endpoint, { method: 'GET' })
  );

  const outcome = mapHttpOutcome<UserValidationData>(response, {
    badRequest: 'Invalid user ID for identity validation.',
    forbidden: 'User account is inactive or access to identity validation was denied.',
    notFound: 'Target user identity record was not found in the university identity directory.',
    unavailable: 'Unable to connect to identity validation service.',
  });
  if (outcome.failure) return outcome.failure;

  const body = outcome.data;
  const dataObj = (body.data || body) as Record<string, unknown>;

  const validationData: UserValidationData = {
    valid: Boolean(dataObj.valid ?? true),
    userId: String(dataObj.userId || dataObj.user_id || normalizedUserId),
    email: dataObj.email ? String(dataObj.email) : undefined,
    accountStatus: dataObj.accountStatus as AccountStatus | undefined,
    isAccountActive: typeof dataObj.isAccountActive === 'boolean' ? dataObj.isAccountActive : undefined,
    roles: Array.isArray(dataObj.roles) ? (dataObj.roles as UserRole[]) : undefined,
    departmentId: dataObj.departmentId ? String(dataObj.departmentId) : undefined,
    facultyId: dataObj.facultyId ? String(dataObj.facultyId) : undefined,
    serviceUnitId: dataObj.serviceUnitId ? String(dataObj.serviceUnitId) : undefined,
    isRoleAuthorized: typeof dataObj.isRoleAuthorized === 'boolean' ? dataObj.isRoleAuthorized : undefined,
  };

  return {
    success: true,
    status: response.status,
    data: validationData,
  };
}

/**
 * Role validation wrapper using GET /validation/users/{user_id}?required_role=...
 * Normalizes roles and prevents duplicates.
 */
export async function validateUserRole(
  userId: string,
  requiredRoles: UserRole | UserRole[]
): Promise<ValidationResult<UserValidationData>> {
  const normalizedUserId = normalizeUserId(userId);
  const rolesArray = [...new Set(Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles])];

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

  return validateUserIdentity(normalizedUserId, rolesArray[0]);
}

/**
 * Account Status Validation:
 * GET /users/{userId}/status
 */
export async function validateAccountStatus(
  userId: string
): Promise<ValidationResult<AccountStatusValidationData>> {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId) {
    return {
      success: false,
      status: 400,
      message: 'User ID is required for account status validation.',
    };
  }

  const endpoint = `/users/${encodeURIComponent(normalizedUserId)}/status`;
  const response = await dedupeValidation(`GET ${endpoint}`, () =>
    apiFetch<Record<string, unknown>>(endpoint, { method: 'GET' })
  );

  const outcome = mapHttpOutcome<AccountStatusValidationData>(response, {
    badRequest: 'Invalid user ID for account status validation.',
    forbidden: 'Account status validation was denied because the account is inactive.',
    notFound: 'Target user identity record was not found in the university identity directory.',
    unavailable: 'Unable to connect to account status validation service.',
  });
  if (outcome.failure) return outcome.failure;

  const body = outcome.data;
  const dataObj = (body.data || body) as Record<string, unknown>;
  const rawStatus = String(dataObj.status || dataObj.accountStatus || 'ACTIVE').toUpperCase() as AccountStatus;

  return {
    success: true,
    status: response.status,
    data: {
      userId: normalizedUserId,
      accountStatus: rawStatus,
      isInactive: rawStatus !== 'ACTIVE',
    },
  };
}

/**
 * Official Directory Validation:
 * GET /validation/departments/{department_id}
 */
export async function validateDepartment(
  departmentId: string
): Promise<ValidationResult<DepartmentValidationData>> {
  const normalizedId = normalizeUserId(departmentId);
  if (!normalizedId) {
    return {
      success: false,
      status: 400,
      message: 'Department ID is required for department validation.',
    };
  }

  const endpoint = `/validation/departments/${encodeURIComponent(normalizedId)}`;
  const response = await apiFetch<Record<string, unknown>>(endpoint, { method: 'GET' });

  const outcome = mapHttpOutcome<DepartmentValidationData>(response, {
    badRequest: 'Department ID is required for department validation.',
    forbidden: 'Department validation access denied.',
    notFound: 'Department not found.',
    unavailable: 'Department validation failed.',
  });
  if (outcome.failure) return outcome.failure;

  const dataObj = (outcome.data.data || outcome.data) as Record<string, unknown>;
  return {
    success: true,
    status: response.status,
    data: {
      valid: Boolean(dataObj.valid ?? true),
      departmentId: normalizedId,
      name: dataObj.name ? String(dataObj.name) : undefined,
      facultyId: dataObj.facultyId ? String(dataObj.facultyId) : undefined,
    },
  };
}

/**
 * Official Directory Validation:
 * GET /validation/faculties/{faculty_id}
 */
export async function validateFaculty(
  facultyId: string
): Promise<ValidationResult<FacultyValidationData>> {
  const normalizedId = normalizeUserId(facultyId);
  if (!normalizedId) {
    return {
      success: false,
      status: 400,
      message: 'Faculty ID is required for faculty validation.',
    };
  }

  const endpoint = `/validation/faculties/${encodeURIComponent(normalizedId)}`;
  const response = await apiFetch<Record<string, unknown>>(endpoint, { method: 'GET' });

  const outcome = mapHttpOutcome<FacultyValidationData>(response, {
    badRequest: 'Faculty ID is required for faculty validation.',
    forbidden: 'Faculty validation access denied.',
    notFound: 'Faculty not found.',
    unavailable: 'Faculty validation failed.',
  });
  if (outcome.failure) return outcome.failure;

  const dataObj = (outcome.data.data || outcome.data) as Record<string, unknown>;
  return {
    success: true,
    status: response.status,
    data: {
      valid: Boolean(dataObj.valid ?? true),
      facultyId: normalizedId,
      name: dataObj.name ? String(dataObj.name) : undefined,
    },
  };
}

/**
 * Official Directory Validation:
 * GET /validation/service-units/{unit_id}
 */
export async function validateServiceUnit(
  unitId: string
): Promise<ValidationResult<ServiceUnitValidationData>> {
  const normalizedId = normalizeUserId(unitId);
  if (!normalizedId) {
    return {
      success: false,
      status: 400,
      message: 'Service unit ID is required for service unit validation.',
    };
  }

  const endpoint = `/validation/service-units/${encodeURIComponent(normalizedId)}`;
  const response = await apiFetch<Record<string, unknown>>(endpoint, { method: 'GET' });

  const outcome = mapHttpOutcome<ServiceUnitValidationData>(response, {
    badRequest: 'Service unit ID is required for service unit validation.',
    forbidden: 'Service unit validation access denied.',
    notFound: 'Service unit not found.',
    unavailable: 'Service unit validation failed.',
  });
  if (outcome.failure) return outcome.failure;

  const dataObj = (outcome.data.data || outcome.data) as Record<string, unknown>;
  return {
    success: true,
    status: response.status,
    data: {
      valid: Boolean(dataObj.valid ?? true),
      unitId: normalizedId,
      name: dataObj.name ? String(dataObj.name) : undefined,
    },
  };
}

/**
 * Official Directory Validation:
 * GET /validation/users/{user_id}/affiliation
 */
export async function validateUserAffiliation(
  userId: string,
  expected?: UserAffiliationExpectation
): Promise<ValidationResult<UserAffiliationValidationData>> {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) {
    return {
      success: false,
      status: 400,
      message: 'User ID is required for affiliation validation.',
    };
  }

  const endpoint = `/validation/users/${encodeURIComponent(normalizedUserId)}/affiliation`;
  const response = await apiFetch<Record<string, unknown>>(endpoint, { method: 'GET' });

  const outcome = mapHttpOutcome<UserAffiliationValidationData>(response, {
    badRequest: 'User ID is required for affiliation validation.',
    forbidden: 'Affiliation validation access denied.',
    notFound: 'User affiliation not found.',
    unavailable: 'Affiliation validation failed.',
  });
  if (outcome.failure) return outcome.failure;

  const dataObj = (outcome.data.data || outcome.data) as Record<string, unknown>;
  const affiliationData: UserAffiliationValidationData = {
    valid: Boolean(dataObj.valid ?? true),
    userId: normalizedUserId,
    facultyId: dataObj.facultyId ? String(dataObj.facultyId) : undefined,
    departmentId: dataObj.departmentId ? String(dataObj.departmentId) : undefined,
    serviceUnitId: dataObj.serviceUnitId ? String(dataObj.serviceUnitId) : undefined,
  };

  if (expected) {
    const mismatches: string[] = [];
    if (expected.facultyId && affiliationData.facultyId !== expected.facultyId) {
      mismatches.push('faculty affiliation');
    }
    if (expected.departmentId && affiliationData.departmentId !== expected.departmentId) {
      mismatches.push('department affiliation');
    }
    if (expected.serviceUnitId && affiliationData.serviceUnitId !== expected.serviceUnitId) {
      mismatches.push('service unit affiliation');
    }
    if (mismatches.length > 0) {
      return {
        success: false,
        status: 403,
        data: affiliationData,
        message: `User affiliation validation failed for ${mismatches.join(', ')}.`,
      };
    }
  }

  return {
    success: true,
    status: response.status,
    data: affiliationData,
  };
}

/**
 * Official Directory Validation:
 * GET /validation/users/{user_id}/responsibilities
 */
export async function validateUserResponsibilities(
  userId: string
): Promise<ValidationResult<UserResponsibilitiesValidationData>> {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) {
    return {
      success: false,
      status: 400,
      message: 'User ID is required for responsibilities validation.',
    };
  }

  const endpoint = `/validation/users/${encodeURIComponent(normalizedUserId)}/responsibilities`;
  const response = await apiFetch<Record<string, unknown>>(endpoint, { method: 'GET' });

  const outcome = mapHttpOutcome<UserResponsibilitiesValidationData>(response, {
    badRequest: 'User ID is required for responsibilities validation.',
    forbidden: 'Responsibilities validation access denied.',
    notFound: 'User responsibilities not found.',
    unavailable: 'Responsibilities validation failed.',
  });
  if (outcome.failure) return outcome.failure;

  const dataObj = (outcome.data.data || outcome.data) as Record<string, unknown>;
  return {
    success: true,
    status: response.status,
    data: {
      valid: Boolean(dataObj.valid ?? true),
      userId: normalizedUserId,
      responsibilities: Array.isArray(dataObj.responsibilities) ? dataObj.responsibilities : undefined,
    },
  };
}
