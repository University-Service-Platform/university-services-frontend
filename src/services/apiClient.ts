/**
 * Shared native Fetch API client.
 *
 * All frontend service calls should pass through this wrapper so base URL,
 * JSON headers, authentication, response parsing, and error handling remain consistent.
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export const AUTH_TOKEN_STORAGE_KEY = 'university-services.auth.token';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Generous default so a sleeping gateway can still wake up, but a hung request never spins forever.
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 60000;

function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
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

  // Abort on timeout, and still honour an abort signal passed in by the caller.
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const callerSignal = options.signal;
  if (callerSignal?.aborted) {
    controller.abort();
  } else {
    callerSignal?.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    return {
      error: timedOut
        ? 'The server took too long to respond. Please try again.'
        : err instanceof Error
          ? err.message
          : 'Network error occurred',
      status: 0,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  const status = response.status;

  if (status === 204) return { status };

  // Parse JSON defensively: an empty or malformed body must not hide the real HTTP status.
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

  if (!response.ok) {
    const errorBody = data as { message?: string; error?: string } | undefined;
    return {
      error:
        errorBody?.message ||
        errorBody?.error ||
        response.statusText ||
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
