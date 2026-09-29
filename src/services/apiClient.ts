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

export function getAuthToken(): string | null {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('jwt') ||
    null
  );
}

export function setAuthToken(token: string): void {
  localStorage.setItem('token', token);
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Authorization')) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : endpoint.startsWith('/api')
    ? endpoint
    : endpoint.startsWith('/')
    ? `${BASE_URL}${endpoint}`
    : `${BASE_URL}/${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const status = response.status;
    
    if (status === 204) return { status }; // Handle empty response

    let data: T | undefined;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const errObj = data as { message?: string; error?: string } | undefined;
      return {
        error: errObj?.message || errObj?.error || response.statusText || 'API Request Failed',
        status,
      };
    }

    return { data, status };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Network error occurred',
      status: 0,
    };
  }
}
