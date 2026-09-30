import { apiFetch } from './apiClient';
import type { AccountStatus } from '@/types';

export interface AccountStatusResult {
  success: boolean;
  accountStatus?: AccountStatus;
  isInactive?: boolean;
  message?: string;
}

function isKnownAccountStatus(value: unknown): value is AccountStatus {
  return value === 'ACTIVE' || value === 'INACTIVE';
}

/**
 * Read a user's account status using official GET /users/{userId}/status
 */
export async function checkAccountStatus(userId?: string): Promise<AccountStatusResult> {
  if (!userId || !userId.trim()) {
    return {
      success: false,
      message: 'User ID is required to verify account status.',
    };
  }

  const endpoint = `/users/${encodeURIComponent(userId.trim())}/status`;
  const response = await apiFetch<Record<string, unknown>>(endpoint, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Unable to verify account status.',
    };
  }

  const resBody = response.data;
  const resData = (resBody?.data || resBody) as Record<string, unknown>;
  const rawStatus = String(resData?.status || resData?.accountStatus || '').toUpperCase();

  if (!isKnownAccountStatus(rawStatus)) {
    return {
      success: false,
      message: 'Unknown account status returned by server.',
    };
  }

  return {
    success: true,
    accountStatus: rawStatus,
    isInactive: rawStatus !== 'ACTIVE',
  };
}

/**
 * Official status endpoint: PATCH /users/{user_id}/status
 */
export async function updateAccountStatus(
  userId: string,
  accountStatus: AccountStatus
): Promise<AccountStatusResult> {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) {
    return {
      success: false,
      message: 'User ID is required to update account status.',
    };
  }

  const endpoint = `/users/${encodeURIComponent(normalizedUserId)}/status`;
  const response = await apiFetch<Record<string, unknown>>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify({ status: accountStatus }),
  });

  if (response.error) {
    return {
      success: false,
      message: response.error,
    };
  }

  const resBody = response.data;
  const resData = (resBody?.data || resBody) as Record<string, unknown> | undefined;
  const rawReturnedStatus = String(resData?.status || resData?.accountStatus || accountStatus).toUpperCase();
  const returnedStatus: AccountStatus = isKnownAccountStatus(rawReturnedStatus) ? rawReturnedStatus : accountStatus;

  return {
    success: true,
    accountStatus: returnedStatus,
    isInactive: returnedStatus !== 'ACTIVE',
    message: `Account status updated to ${returnedStatus} successfully.`,
  };
}

/**
 * Convenience wrapper to activate a user account.
 */
export async function activateAccount(userId: string): Promise<AccountStatusResult> {
  return updateAccountStatus(userId, 'ACTIVE');
}

/**
 * Convenience wrapper to deactivate a user account.
 */
export async function deactivateAccount(userId: string): Promise<AccountStatusResult> {
  return updateAccountStatus(userId, 'INACTIVE');
}
