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

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const status = response.status;
    
    if (status === 24) return { status }; // Handle empty response

    let data: T | undefined;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      return {
        error: (data as { message?: string })?.message || response.statusText || 'API Request Failed',
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
