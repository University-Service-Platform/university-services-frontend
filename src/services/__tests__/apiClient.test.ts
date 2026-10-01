import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, AUTH_TOKEN_STORAGE_KEY, NETWORK_ERROR_MESSAGE, TIMEOUT_ERROR_MESSAGE } from '../apiClient';
import { installSessionStorage, jsonResponse, mockFetch, requestHeaders } from './testUtils';

// Default when VITE_API_TIMEOUT_MS is not set (the base URL may come from a local .env, so only paths are asserted).
const REQUEST_TIMEOUT_MS = 60000;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('apiFetch request behaviour', () => {
  it('prefixes the gateway base URL and attaches the stored Bearer token', async () => {
    installSessionStorage().setItem(AUTH_TOKEN_STORAGE_KEY, 'token-123');
    const fetchMock = mockFetch(jsonResponse(200, { ok: true }));

    await apiFetch('/users', { method: 'GET' });

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/users$/);
    expect(requestHeaders(fetchMock).get('Authorization')).toBe('Bearer token-123');
    expect(requestHeaders(fetchMock).get('Content-Type')).toBe('application/json');
  });

  it('clears the stored token when the gateway answers 401', async () => {
    const storage = installSessionStorage();
    storage.setItem(AUTH_TOKEN_STORAGE_KEY, 'expired');
    mockFetch(jsonResponse(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'Token expired' } }));

    const result = await apiFetch('/users');

    expect(result).toMatchObject({ status: 401, error: 'Token expired' });
    expect(storage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });
});

describe('apiFetch response handling', () => {
  it('returns the status without data or error for 204 No Content', async () => {
    mockFetch(jsonResponse(204));
    await expect(apiFetch('/users/1', { method: 'DELETE' })).resolves.toEqual({ status: 204 });
  });

  it('treats an empty JSON body as no data rather than an error', async () => {
    mockFetch(new Response('', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    await expect(apiFetch('/users')).resolves.toEqual({ data: undefined, status: 200 });
  });

  it('keeps the real status when a response has malformed JSON', async () => {
    mockFetch(new Response('{not json', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    await expect(apiFetch('/users')).resolves.toEqual({
      status: 200,
      error: 'Invalid JSON response received from the server.',
    });
  });

  it.each([400, 403, 404, 500])('surfaces the backend envelope message and status for HTTP %i', async (status) => {
    mockFetch(jsonResponse(status, { success: false, error: { code: 'ERR', message: `Backend ${status}` } }));
    const result = await apiFetch('/users');
    expect(result).toMatchObject({ status, error: `Backend ${status}` });
  });

  it('falls back to a status message when there is no body or status text', async () => {
    mockFetch(jsonResponse(503));
    await expect(apiFetch('/users')).resolves.toMatchObject({
      status: 503,
      error: 'API request failed with status 503.',
    });
  });

  it('reports network failures as status 0 with a readable message', async () => {
    mockFetch(new TypeError('Failed to fetch'));
    await expect(apiFetch('/users')).resolves.toEqual({ status: 0, error: NETWORK_ERROR_MESSAGE });
  });
});

describe('apiFetch timeout', () => {
  function stubHangingFetch(headersArrive = false) {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        if (headersArrive) {
          // Headers arrive at once but the body never finishes.
          const body = new ReadableStream({
            start(streamController) {
              init.signal?.addEventListener('abort', () =>
                streamController.error(new DOMException('Aborted', 'AbortError'))
              );
            },
          });
          return Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      })
    );
  }

  it('aborts a request the gateway never answers', async () => {
    vi.useFakeTimers();
    stubHangingFetch();

    const pending = apiFetch('/users');
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);

    await expect(pending).resolves.toEqual({ status: 0, error: TIMEOUT_ERROR_MESSAGE, timedOut: true });
  });

  it('also times out when the response body stalls after the headers arrive', async () => {
    vi.useFakeTimers();
    stubHangingFetch(true);

    const pending = apiFetch('/users');
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);

    await expect(pending).resolves.toEqual({ status: 200, error: TIMEOUT_ERROR_MESSAGE, timedOut: true });
  });

  it('reports a caller-cancelled request as cancelled, not timed out', async () => {
    stubHangingFetch();
    const controller = new AbortController();

    const pending = apiFetch('/users', { signal: controller.signal });
    controller.abort();

    await expect(pending).resolves.toEqual({ status: 0, error: 'The request was cancelled.' });
  });
});
