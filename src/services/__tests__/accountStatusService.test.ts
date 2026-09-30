import { describe, it, expect } from 'vitest';
import { checkAccountStatus, updateAccountStatus } from '../accountStatusService';

describe('accountStatusService', () => {
  it('handles invalid user id for checkAccountStatus', async () => {
    const emptyCheck = await checkAccountStatus('');
    expect(emptyCheck.success).toBe(false);

    const blankCheck = await checkAccountStatus('   ');
    expect(blankCheck.success).toBe(false);
  });

  it('handles invalid user id for updateAccountStatus', async () => {
    const emptyUpdate = await updateAccountStatus('', 'ACTIVE');
    expect(emptyUpdate.success).toBe(false);

    const blankUpdate = await updateAccountStatus('  \t', 'INACTIVE');
    expect(blankUpdate.success).toBe(false);
    expect(blankUpdate.message).toBe('User ID is required to update account status.');
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
