import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkAccountStatus, updateAccountStatus } from '../accountStatusService';
import { mockFetch } from './testUtils';

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Lightweight input checks for the account status service that do not call the backend.
 */
describe('account status input validation', () => {
  it('rejects empty and blank user IDs without calling the backend', async () => {
    const fetchMock = mockFetch();

    expect((await checkAccountStatus('')).success).toBe(false);
    expect((await checkAccountStatus('   ')).success).toBe(false);
    expect((await updateAccountStatus('', 'ACTIVE')).success).toBe(false);

    const blankUpdate = await updateAccountStatus('  \t', 'INACTIVE');
    expect(blankUpdate.success).toBe(false);
    expect(blankUpdate.message).toBe('User ID is required to update account status.');

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

export async function runAccountStatusServiceTests(): Promise<boolean> {
  try {
    const emptyCheck = await checkAccountStatus('');
    if (emptyCheck.success !== false) return false;

    const blankCheck = await checkAccountStatus('   ');
    if (blankCheck.success !== false) return false;

    const emptyUpdate = await updateAccountStatus('', 'ACTIVE');
    if (emptyUpdate.success !== false) return false;

    const blankUpdate = await updateAccountStatus('  \t', 'INACTIVE');
    if (blankUpdate.success !== false) return false;

    return true;
  } catch {
    return false;
  }
}
