/**
 * Native Fetch API Client Foundation
 *
 * Provides standard request wrapper for future backend services.
 * Does not implement backend logic or hardcoded mock API endpoints.
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

// Session-scoped token written by authService after login; sent as the Bearer credential
// required by the confirmed cross-team validation contract.
export const AUTH_TOKEN_STORAGE_KEY = 'university-services.auth.token';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredAuthToken(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem('university-services.auth.user');
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

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Network error occurred',
      status: 0,
    };
  }

  const status = response.status;

  if (status === 401) {
    clearStoredAuthToken();
  }

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
