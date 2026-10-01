import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_TOKEN_STORAGE_KEY, NETWORK_ERROR_MESSAGE } from '../apiClient';
import { AUTH_USER_STORAGE_KEY, getStoredAuthSession, loginUser } from '../authService';
import { installSessionStorage, jsonResponse, mockFetch, requestHeaders } from './testUtils';

const previousUser = { id: 'USER-OLD', roles: ['ADMIN'], accountStatus: 'ACTIVE' };
const loginSuccess = { success: true, data: { access_token: 'new-token', user_id: 'USER-NEW' } };
const meSuccess = {
  success: true,
  data: { id: 'USER-NEW', email: 'new@kln.ac.lk', roles: ['STUDENT'], status: 'ACTIVE' },
};

let storage: Storage;

beforeEach(() => {
  storage = installSessionStorage();
  storage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(previousUser));
  storage.setItem(AUTH_TOKEN_STORAGE_KEY, 'stale-token');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loginUser session handling', () => {
  it('does not send the previous user Bearer token with the login request', async () => {
    const fetchMock = mockFetch(jsonResponse(200, loginSuccess), jsonResponse(200, meSuccess));

    await loginUser({ identifier: 'new@kln.ac.lk', password: 'pw' });

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/login$/);
    expect(requestHeaders(fetchMock, 0).has('Authorization')).toBe(false);
    // The follow-up profile call uses the newly issued token.
    expect(requestHeaders(fetchMock, 1).get('Authorization')).toBe('Bearer new-token');
  });

  it('stores the new user and token on success', async () => {
    mockFetch(jsonResponse(200, loginSuccess), jsonResponse(200, meSuccess));

    const result = await loginUser({ identifier: 'new@kln.ac.lk', password: 'pw' });

    expect(result.success).toBe(true);
    expect(getStoredAuthSession()?.user.id).toBe('USER-NEW');
    expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('new-token');
  });

  it('reports invalid credentials on 401 and leaves no session behind', async () => {
    mockFetch(jsonResponse(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'Bad credentials' } }));

    const result = await loginUser({ identifier: 'x', password: 'bad' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Invalid University ID\/Email or password/);
    expect(getStoredAuthSession()).toBeNull();
    expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('flags inactive accounts on 403', async () => {
    mockFetch(jsonResponse(403, { success: false, error: { code: 'FORBIDDEN', message: 'Inactive' } }));

    const result = await loginUser({ identifier: 'x', password: 'pw' });

    expect(result).toMatchObject({ success: false, isInactive: true });
    expect(getStoredAuthSession()).toBeNull();
  });

  it('shows a readable message when the gateway is unreachable', async () => {
    mockFetch(new TypeError('Failed to fetch'));

    const result = await loginUser({ identifier: 'x', password: 'pw' });

    expect(result).toEqual({ success: false, message: NETWORK_ERROR_MESSAGE });
  });
});
