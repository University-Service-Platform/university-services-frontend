import { apiFetch } from './apiClient';
import type { AccountStatus } from '@/types';

export interface AccountStatusResult {
  success: boolean;
  accountStatus?: AccountStatus;
  isInactive?: boolean;
  message?: string;
}

/**
 * UNCONFIRMED INTEGRATION BOUNDARY:
 * Official backend API contract for account status verification endpoints is not yet documented in the repository.
 * The endpoint constant below serves as a placeholder integration boundary that will be updated
 * once the official backend OpenAPI/Swagger specification is provided by the backend team.
 */
export const ACCOUNT_STATUS_API_ENDPOINT = import.meta.env.VITE_ACCOUNT_STATUS_API_ENDPOINT || '/users/account-status';

export async function checkAccountStatus(userId?: string): Promise<AccountStatusResult> {
  if (!userId) {
    return {
      success: false,
      message: 'User ID is required to verify account status.',
    };
  }

  const response = await apiFetch<{ accountStatus: AccountStatus }>(`${ACCOUNT_STATUS_API_ENDPOINT}/${userId}`, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: 'Unable to connect to account status verification service. Official backend contract is pending integration.',
    };
  }

  const status = response.data.accountStatus;
  const isInactive = status !== 'ACTIVE';

  return {
    success: true,
    accountStatus: status,
    isInactive,
  };
}

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * Update account status endpoint boundary. Official backend contract is pending.
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

  const response = await apiFetch<{ accountStatus: AccountStatus }>(`${ACCOUNT_STATUS_API_ENDPOINT}/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ accountStatus }),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to update account status. Unable to connect to account status backend service.',
    };
  }

  const status = response.data.accountStatus;
  const isInactive = status !== 'ACTIVE';

  return {
    success: true,
    accountStatus: status,
    isInactive,
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

