import { apiFetch } from './apiClient';
import { validateAccountStatus } from './validationService';
import type { AccountStatus } from '@/types';

export interface AccountStatusResult {
  success: boolean;
  accountStatus?: AccountStatus;
  isInactive?: boolean;
  message?: string;
}

/**
 * Confirmed verification endpoint from docs/CROSS_TEAM_VALIDATION_API.md and
 * docs/openapi-cross-team-validation.yaml. The status-management PATCH endpoint
 * below remains unconfirmed because no official management contract is published.
 */
export const ACCOUNT_STATUS_API_ENDPOINT = import.meta.env.VITE_ACCOUNT_STATUS_API_ENDPOINT || '/users/account-status';

function isKnownAccountStatus(value: unknown): value is AccountStatus {
  return value === 'ACTIVE' || value === 'INACTIVE';
}

/**
 * Read a user's account status through the confirmed
 * GET /users/account-status/{userId} contract (shared with validationService so
 * there is a single implementation of that call).
 *
 * `success` means the status was retrieved; an INACTIVE account is a successful
 * read with `isInactive: true`.
 */
export async function checkAccountStatus(userId?: string): Promise<AccountStatusResult> {
  if (!userId || !userId.trim()) {
    return {
      success: false,
      message: 'User ID is required to verify account status.',
    };
  }

  const result = await validateAccountStatus(userId);
  const status = result.data?.accountStatus;

  if (!isKnownAccountStatus(status)) {
    return {
      success: false,
      message: result.message || 'Unable to verify account status.',
    };
  }

  return {
    success: true,
    accountStatus: status,
    isInactive: status !== 'ACTIVE' || Boolean(result.data?.isInactive),
  };
}

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * Update account status endpoint boundary. Official backend contract is pending.
 * If the backend accepts the change without returning a recognised status, the
 * resulting status is re-read from the confirmed account-status endpoint instead
 * of assuming the requested value was applied.
 */
export async function updateAccountStatus(
  userId: string,
  accountStatus: AccountStatus
): Promise<AccountStatusResult> {
  if (!userId) {
    return {
      success: false,
      message: 'User ID is required to update account status.',
    };
  }

  const response = await apiFetch<{ accountStatus?: AccountStatus }>(
    `${ACCOUNT_STATUS_API_ENDPOINT}/${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ accountStatus }),
    }
  );

  if (response.error) {
    return {
      success: false,
      message: response.error || 'Failed to update account status. Unable to connect to account status backend service.',
    };
  }

  let status = response.data?.accountStatus;
  if (!isKnownAccountStatus(status)) {
    const verified = await checkAccountStatus(userId);
    if (!verified.success || !verified.accountStatus) {
      return {
        success: false,
        message:
          'The account status request was sent, but the resulting status could not be confirmed. Please refresh to verify the current status.',
      };
    }
    status = verified.accountStatus;
  }

  if (status !== accountStatus) {
    return {
      success: false,
      accountStatus: status,
      isInactive: status !== 'ACTIVE',
      message: `Account status was not changed. The backend reports the account as ${status}.`,
    };
  }

  return {
    success: true,
    accountStatus: status,
    isInactive: status !== 'ACTIVE',
    message: `Account status updated to ${status} successfully.`,
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

