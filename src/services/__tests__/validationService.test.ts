import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  validateUserIdentity,
  validateUserRole,
  validateAccountStatus,
  validateUserAffiliation,
} from '../validationService';
import { jsonResponse, mockFetch } from './testUtils';

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Lightweight integration-boundary checks; the backend is mocked at fetch level.
 */
describe('input validation (no backend call)', () => {
  it('rejects missing or blank user IDs and empty role lists with 400', async () => {
    const fetchMock = mockFetch();

    await expect(validateUserIdentity('')).resolves.toMatchObject({ success: false, status: 400 });
    await expect(validateUserRole('', ['STUDENT'])).resolves.toMatchObject({ success: false, status: 400 });
    await expect(validateUserRole('USER-1001', [])).resolves.toMatchObject({ success: false, status: 400 });
    await expect(validateAccountStatus('')).resolves.toMatchObject({ success: false, status: 400 });
    await expect(validateUserIdentity('   ')).resolves.toMatchObject({ success: false, status: 400 });
    await expect(validateAccountStatus('\t ')).resolves.toMatchObject({ success: false, status: 400 });
    await expect(validateUserRole(' ', 'STUDENT')).resolves.toMatchObject({ success: false, status: 400 });
    await expect(validateUserAffiliation('', { departmentId: 'DEPT-1' })).resolves.toMatchObject({
      success: false,
      status: 400,
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('gateway response handling', () => {
  it('reports an unreachable gateway as status 0, not a synthesised 500', async () => {
    mockFetch(new TypeError('Failed to fetch'));

    const result = await validateUserIdentity('USER-1001');

    expect(result.success).toBe(false);
    expect(result.status).toBe(0);
  });

  it('keeps the real status of an unexpected gateway error', async () => {
    mockFetch(jsonResponse(502, undefined, 'Bad Gateway'));

    const result = await validateUserIdentity('USER-1001');

    expect(result).toMatchObject({ success: false, status: 502 });
  });

  it.each([400, 401, 403, 404])('preserves HTTP %i and the backend message', async (status) => {
    mockFetch(jsonResponse(status, { success: false, error: { code: 'ERR', message: `Backend ${status}` } }));

    await expect(validateUserIdentity('USER-1001')).resolves.toMatchObject({
      success: false,
      status,
      message: `Backend ${status}`,
    });
  });

  it('shares one backend call between identical in-flight requests', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { valid: true, userId: 'USER-1001' }));

    const [first, second] = await Promise.all([
      validateUserIdentity('USER-1001'),
      validateUserIdentity('USER-1001'),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });
});

export async function runValidationServiceTests(): Promise<boolean> {
  try {
    const emptyResult = await validateUserIdentity('');
    if (emptyResult.success !== false || emptyResult.status !== 400) return false;

    const emptyRoleResult = await validateUserRole('', ['STUDENT']);
    if (emptyRoleResult.success !== false || emptyRoleResult.status !== 400) return false;

    const emptyStatusResult = await validateAccountStatus('');
    if (emptyStatusResult.success !== false || emptyStatusResult.status !== 400) return false;

    const emptyAffiliationResult = await validateUserAffiliation('', { departmentId: 'DEPT-1' });
    if (emptyAffiliationResult.success !== false || emptyAffiliationResult.status !== 400) return false;

    return true;
  } catch {
    return false;
  }
}
