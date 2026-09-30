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
