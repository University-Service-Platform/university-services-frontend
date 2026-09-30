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
  | { ok: false; status: number; kind: G8ErrorKind; message: string; demo: boolean; code?: string };

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
export function g8Fail<T>(status: number, message?: string, demo = false, code?: string): G8Result<T> {
  const kind = kindFromStatus(status);
  return { ok: false, status, kind, message: message || DEFAULT_MESSAGES[kind], demo, code };
}

/**
 * User-facing wording for backend error codes. event-service sends its own message as well;
 * communication-feedback-service sends only `{ code }`, so its codes need wording here.
 */
const BACKEND_CODE_MESSAGES: Record<string, string> = {
  // event-service
  CAPACITY_REACHED: 'Capacity reached - registration is closed for this event.',
  ALREADY_REGISTERED: 'You are already registered for this event.',
  REGISTRATION_CLOSED: 'Registration is not open for this event right now.',
  EVENT_NOT_PUBLISHED: 'This event is not open for registration.',
  CANCELLATION_CLOSED: 'This registration can no longer be cancelled because the event has started.',
  NOT_VISIBLE: 'You do not have access to this event.',
  INVALID_USER: 'Your account could not be verified with University Identity Services.',
  GROUP5_UNAVAILABLE: 'University Identity Services is unavailable, so eligibility could not be checked. Nothing was saved.',
  GROUP6_UNAVAILABLE: 'Facility Services is unavailable, so the venue could not be checked. Nothing was saved.',
  // communication-feedback-service
  ANNOUNCEMENT_FORBIDDEN: 'You are not allowed to publish announcements.',
  ANNOUNCEMENT_NOT_DRAFT: 'Only draft announcements can be published.',
  ANNOUNCEMENT_NOT_FOUND: 'This announcement no longer exists.',
  TARGETED_AUDIENCE_REQUIRES_RULE_VALUE: 'Choose who the announcement is for (a role, faculty, department or service unit).',
  ALL_AUDIENCE_MUST_NOT_HAVE_RULE_VALUE: 'An announcement for everyone cannot also target a specific group.',
  FEEDBACK_NOT_ELIGIBLE: 'You can give feedback only for completed activities you took part in.',
  FEEDBACK_ALREADY_SUBMITTED: 'You have already submitted feedback for this activity.',
  FEEDBACK_FORM_INACTIVE: 'This feedback form is closed.',
  FEEDBACK_FORM_NOT_FOUND: 'This feedback form no longer exists.',
  FEEDBACK_RESPONSES_FORBIDDEN: 'Only authorized staff can view feedback responses.',
  NOTIFICATION_FORBIDDEN: 'This notification belongs to another user.',
  NOTIFICATION_NOT_FOUND: 'This notification no longer exists.',
  INVALID_USER_ID: 'Your session could not be matched to a Group 8 user. Please sign in again.',
  RECIPIENT_DIRECTORY_UNAVAILABLE: 'University Identity Services is unavailable. Please try again shortly.',
  FACILITY_DIRECTORY_UNAVAILABLE: 'Facility Services is unavailable. Please try again shortly.',
  VALIDATION_FAILED: 'Some details are invalid. Please review them and try again.',
};

/** Reads `{ error: { code, message } }` (event-service, gateway), `{ code }` (communication service) or `{ message }`. */
function readBackendError(data: unknown, fallback?: string): { code?: string; message?: string } {
  const body = (data ?? {}) as { code?: unknown; message?: unknown; error?: unknown };
  const nested = typeof body.error === 'object' && body.error !== null ? (body.error as { code?: unknown; message?: unknown }) : undefined;
  const code = [nested?.code, body.code].find((value): value is string => typeof value === 'string');
  const serverMessage = [nested?.message, body.message, typeof body.error === 'string' ? body.error : undefined].find(
    (value): value is string => typeof value === 'string' && value.length > 0 && value !== code
  );
  const mapped = code ? BACKEND_CODE_MESSAGES[code] : undefined;
  // The client's fallback is usually just the HTTP status text, so it comes last.
  const usableFallback = fallback && fallback !== 'API Request Failed' && !/^API request failed/.test(fallback) ? fallback : undefined;
  // Prefer the service's own sentence, then our wording for code-only services, then the status text.
  return { code, message: serverMessage ?? mapped ?? (code ? undefined : usableFallback) };
}

export function g8Ok<T>(data: T, demo = false): G8Result<T> {
  return { ok: true, data, demo };
}

function isGatewayUnreachable(status: number, error?: string, code?: string): boolean {
  if (status === 0 || status === 502 || status === 504) return true;
  // The API Gateway answers ROUTE_NOT_FOUND while a Group 8 service is not connected yet.
  if (status === 404 && code === 'ROUTE_NOT_FOUND') return true;
  // A 404 without a JSON error body means the route is not served at all (e.g. no gateway in dev),
  // as opposed to a service-level "event not found" which carries a code or message.
  return status === 404 && !code && (!error || error === 'Not Found');
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

  const backendError = readBackendError(response.data, typeof response.error === 'string' ? response.error : undefined);
  const unreachable =
    servedByFallback || isGatewayUnreachable(response.status, typeof response.error === 'string' ? response.error : undefined, backendError.code);

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

  return g8Fail<T>(response.status, backendError.message, false, backendError.code);
}

/**
 * Calls a Group 8 service whose response shape differs from the UI model and converts live
 * responses with `map`. Demo results are already in the UI shape, so they pass through unchanged.
 */
export async function g8RequestMapped<B, U>(
  endpoint: string,
  options: { method?: G8RequestOptions<U>['method']; body?: unknown; demo?: () => G8Result<U> },
  map: (body: B) => U | Promise<U>
): Promise<G8Result<U>> {
  const result = await g8Request<B | U>(endpoint, {
    method: options.method,
    body: options.body,
    demo: options.demo as (() => G8Result<B | U>) | undefined,
  });
  if (!result.ok || result.demo) return result as G8Result<U>;
  return g8Ok(await map(result.data as B));
}

/**
 * The Group 8 Java services use LocalDateTime (no time zone). Convert an ISO instant to the
 * browser's local wall-clock time, e.g. "2026-10-05T10:00:00".
 */
export function toBackendLocalDateTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
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
