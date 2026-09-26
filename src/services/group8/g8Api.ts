import { apiFetch } from '../apiClient';
import type { UserProfile } from '@/types';

/**
 * Group 8 API foundation
 *
 * All Group 8 calls go through the shared `apiFetch` (API Gateway base path,
 * VITE_API_BASE_URL, default `/api/v1`) - never directly to a microservice port.
 *
 * Gateway base paths registered for Group 8 (draft contract):
 *   event-service                   -> /events, /registrations
 *   communication-feedback-service  -> /announcements, /notifications, /feedback, /engagement
 *
 * Error handling follows the Group 8 frontend rules:
 *   400 validation | 401 session | 403 forbidden | 404 not found
 *   409 conflict (capacity / duplicate / closed window) | 503 dependency unavailable
 *
 * DEMO FALLBACK: when the gateway route is unreachable (network error, 404 route
 * not registered, 502/504) and VITE_G8_DEMO_MODE is not "false", the caller's
 * synthetic in-memory handler is used so the UI can be reviewed before the
 * backend is deployed. Pages show a visible "demo data" notice in that case.
 * Real backend responses (400/401/403/409/503 ...) are never masked.
 */

export type G8ErrorKind =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'dependency_unavailable'
  | 'network'
  | 'unknown';

export type G8Result<T> =
  | { ok: true; data: T; demo: boolean }
  | { ok: false; status: number; kind: G8ErrorKind; message: string; demo: boolean };

export const G8_DEMO_MODE_ENABLED = import.meta.env.VITE_G8_DEMO_MODE !== 'false';

const DEFAULT_MESSAGES: Record<G8ErrorKind, string> = {
  validation: 'Some details are invalid. Please review the highlighted fields and try again.',
  unauthenticated: 'Your session has expired. Please sign in again to continue.',
  forbidden: 'You do not have permission to perform this action.',
  not_found: 'The requested item could not be found. It may have been removed.',
  conflict: 'This action conflicts with the current state. Please refresh and try again.',
  dependency_unavailable:
    'A connected university service is temporarily unavailable. No changes were saved - please try again shortly.',
  network: 'Unable to reach university services. Check your connection and try again.',
  unknown: 'Something went wrong. Please try again.',
};

export function kindFromStatus(status: number): G8ErrorKind {
  if (status === 0) return 'network';
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 503) return 'dependency_unavailable';
  return 'unknown';
}

/** Builds a failed result with a user-facing message (used by demo handlers too). */
export function g8Fail<T>(status: number, message?: string, demo = false): G8Result<T> {
  const kind = kindFromStatus(status);
  return { ok: false, status, kind, message: message || DEFAULT_MESSAGES[kind], demo };
}

export function g8Ok<T>(data: T, demo = false): G8Result<T> {
  return { ok: true, data, demo };
}

function isGatewayUnreachable(status: number, error?: string): boolean {
  if (status === 0 || status === 502 || status === 504) return true;
  // A 404 without a JSON error body means the gateway route is not registered yet,
  // as opposed to a service-level "event not found" which carries a message.
  return status === 404 && (!error || error === 'Not Found');
}

/* ------------------------------------------------------------------ */
/* Demo identity - lets synthetic handlers apply eligibility rules     */
/* ------------------------------------------------------------------ */

let demoIdentity: UserProfile | null = null;

export function setG8DemoIdentity(user: UserProfile | null): void {
  demoIdentity = user;
}

export function getG8DemoIdentity(): UserProfile | null {
  return demoIdentity;
}

/* ------------------------------------------------------------------ */
/* Session expiry                                                      */
/* ------------------------------------------------------------------ */

/** Window event fired when any Group 8 call is rejected with 401 (expired or missing session). */
export const G8_SESSION_EXPIRED_EVENT = 'g8:session-expired';

function notifySessionExpired(): void {
  window.dispatchEvent(new CustomEvent(G8_SESSION_EXPIRED_EVENT));
}

/* ------------------------------------------------------------------ */
/* Request helper                                                      */
/* ------------------------------------------------------------------ */

export interface G8RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Synthetic handler used only when the gateway is unreachable. */
  demo?: () => G8Result<T>;
}

export async function g8Request<T>(endpoint: string, options: G8RequestOptions<T> = {}): Promise<G8Result<T>> {
  const { method = 'GET', body, demo } = options;

  const response = await apiFetch<T>(endpoint, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const succeeded = !response.error && response.status >= 200 && response.status < 300;
  // A GET that "succeeds" without a JSON body was answered by an SPA/static fallback
  // (e.g. index.html), not by a Group 8 service - treat the route as not served.
  const servedByFallback = succeeded && method === 'GET' && response.data === undefined;

  if (succeeded && !servedByFallback) {
    return g8Ok(response.data as T);
  }

  const unreachable = servedByFallback || isGatewayUnreachable(response.status, response.error);

  if (demo && G8_DEMO_MODE_ENABLED && unreachable) {
    // Simulated latency keeps loading states visible during UI review.
    await new Promise((resolve) => setTimeout(resolve, 250));
    return demo();
  }

  if (response.status === 401) {
    notifySessionExpired();
  }

  if (servedByFallback) {
    return g8Fail<T>(404, 'This Group 8 service route is not registered on the API Gateway.');
  }

  const genericError = !response.error || response.error === 'API Request Failed';
  return g8Fail<T>(response.status, genericError ? undefined : response.error);
}

/* ------------------------------------------------------------------ */
/* Small shared helpers                                                */
/* ------------------------------------------------------------------ */

let demoIdCounter = 1000;
export function nextDemoId(prefix: string): string {
  demoIdCounter += 1;
  return `${prefix}-${demoIdCounter}`;
}

export function toQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}
