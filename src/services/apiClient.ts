/**
 * Shared Native Fetch API Client Foundation
 *
 * Provides standard request wrapper for backend services.
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  /** Real HTTP status, or 0 when no response was received (network failure, timeout, cancellation). */
  status: number;
  /** True when the request was aborted because it exceeded the request timeout. */
  timedOut?: boolean;
}

export const AUTH_TOKEN_STORAGE_KEY = 'university-services.auth.token';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Generous default so a sleeping gateway can still wake up, but a hung request never spins forever.
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 60000;

export const NETWORK_ERROR_MESSAGE = 'Unable to reach university services. Check your connection and try again.';
export const TIMEOUT_ERROR_MESSAGE = 'The server took too long to respond. Please try again.';
const CANCELLED_ERROR_MESSAGE = 'The request was cancelled.';

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return (
      sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('jwt') ||
      null
    );
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return getStoredAuthToken();
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem('token', token);
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    // Best-effort
  }
}

export function clearStoredAuthToken(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem('university-services.auth.user');
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
    localStorage.removeItem('auth_token');
  } catch {
    // Session cleanup is best-effort
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : endpoint.startsWith('/api')
    ? endpoint
    : endpoint.startsWith('/')
    ? `${BASE_URL}${endpoint}`
    : `${BASE_URL}/${endpoint}`;

  // Abort on timeout, and still honour an abort signal passed in by the caller.
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const callerSignal = options.signal;
  const abortFromCaller = () => controller.abort();
  if (callerSignal?.aborted) {
    controller.abort();
  } else {
    callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  }
  const releaseTimeout = () => {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch {
    releaseTimeout();
    // Browser fetch errors ("Failed to fetch", "Load failed", ...) are not user-facing text.
    if (timedOut) {
      return { error: TIMEOUT_ERROR_MESSAGE, status: 0, timedOut: true };
    }
    return {
      error: callerSignal?.aborted ? CANCELLED_ERROR_MESSAGE : NETWORK_ERROR_MESSAGE,
      status: 0,
    };
  }

  const status = response.status;

  if (status === 401) {
    clearStoredAuthToken();
  }

  if (status === 204) {
    releaseTimeout();
    return { status };
  }

  // Parse JSON defensively: an empty or malformed body must not hide the real HTTP status.
  // The timeout stays armed while the body downloads, so a stalled body also times out.
  let data: T | undefined;
  let parseError: string | undefined;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const text = await response.text();
      data = text ? (JSON.parse(text) as T) : undefined;
    } catch {
      parseError = 'Invalid JSON response received from the server.';
    }
  }
  releaseTimeout();

  if (timedOut) {
    return { error: TIMEOUT_ERROR_MESSAGE, status, timedOut: true };
  }

  if (!response.ok) {
    let errorMessage: string | undefined;

    if (data && typeof data === 'object') {
      const bodyObj = data as Record<string, unknown>;

      // Official backend envelope: { "success": false, "error": { "code": "...", "message": "..." } }
      if (bodyObj.error) {
        if (typeof bodyObj.error === 'object' && bodyObj.error !== null) {
          const errObj = bodyObj.error as Record<string, unknown>;
          if (typeof errObj.message === 'string' && errObj.message.trim()) {
            errorMessage = errObj.message;
          } else if (typeof errObj.code === 'string' && errObj.code.trim()) {
            errorMessage = errObj.code;
          }
        } else if (typeof bodyObj.error === 'string' && bodyObj.error.trim()) {
          errorMessage = bodyObj.error;
        }
      }

      if (!errorMessage && typeof bodyObj.message === 'string' && bodyObj.message.trim()) {
        errorMessage = bodyObj.message;
      }
    } else if (typeof data === 'string' && data.trim()) {
      errorMessage = data;
    }

    if (typeof errorMessage !== 'string') {
      errorMessage = undefined;
    }

    if (status === 403 && (!errorMessage || errorMessage === 'Forbidden')) {
      errorMessage = 'You are not authorized to perform this action.';
    }

    return {
      error:
        errorMessage ||
        (response.statusText && response.statusText !== 'OK' ? response.statusText : undefined) ||
        `API request failed with status ${status}.`,
      status,
      data,
    };
  }

  if (parseError) {
    return { error: parseError, status };
  }

  return { data, status };
}

/**
 * The platform's services answer `{ success, data }`. Returns `data` from that envelope,
 * or the body itself when a service sends its payload unwrapped.
 */
export function unwrapData<T>(body: unknown): T | undefined {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
    return (body as { data?: T }).data;
  }
  return body as T | undefined;
}

/** The list in a response body, wrapped or not; null when the body holds no list. */
export function unwrapList(body: unknown): Record<string, unknown>[] | null {
  const data = unwrapData<unknown>(body);
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : null;
}
