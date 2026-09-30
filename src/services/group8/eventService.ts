import { G8_ORGANIZER_ROLES } from '@/config/group8Routes';
import type {
  EligibilityRule,
  EventStatus,
  EventUpsertRequest,
  Registration,
  RegistrationSummary,
  UniversityEvent,
  UserRole,
  VenueValidationResult,
} from '@/types';
import {
  g8Fail,
  g8Ok,
  g8RequestMapped,
  getG8DemoIdentity,
  nextDemoId,
  toBackendLocalDateTime,
  toQuery,
  type G8Result,
} from './g8Api';
import { recordDemoNotification } from './communicationService';

/**
 * event-service client (Group 8)
 *
 * Integrated with the Group 8 event-service (EventManagement-Uni-Service-Management-System_Backend)
 * through the API Gateway (`/api/v1`). Backend shapes are translated to the UI model below.
 *
 *   GET    /events?status=&mine=                     events visible to the caller (search is client-side)
 *   GET    /events/{id}
 *   POST   /events                                   create (DRAFT) - EVENT_ORGANIZER / ACADEMIC_STAFF / ADMIN
 *   PATCH  /events/{id}                              partial update
 *   PATCH  /events/{id}/publish                      venue validated with Group 6 at publish
 *   PATCH  /events/{id}/cancel                       cancels registrations and notifies (BR8-04)
 *   PATCH  /events/{id}/complete                     marks a started event COMPLETED (opens feedback)
 *   POST   /events/{id}/registrations                register the caller (Group 5 eligibility, capacity, window)
 *   GET    /events/{id}/registrations                organizer capacity summary
 *   GET    /registrations/mine                       the caller's registrations
 *   PATCH  /registrations/{id}/cancel                cancel own registration (until the event starts)
 *
 * Venue check (Group 6 facility-resource-service via the gateway):
 *   GET    /resources/code/{code}/validate
 */

export const EVENTS_API = '/events';
export const REGISTRATIONS_API = '/registrations';

/** Roles allowed to organise events (BR8-01). Final check is always server-side. */
export const EVENT_ORGANIZER_ROLES: UserRole[] = G8_ORGANIZER_ROLES;

/* ------------------------------------------------------------------ */
/* event-service shapes and translation to the UI model               */
/* ------------------------------------------------------------------ */

interface EventResponse {
  id: string;
  title: string;
  description: string | null;
  organizerId: string;
  venue: string | null;
  online: boolean;
  scheduleStart: string;
  scheduleEnd: string;
  capacity: number;
  eligibilityRule: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  status: EventStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface RegistrationResponse {
  id: string;
  eventId: string;
  userId: string;
  status: Registration['status'];
  createdAt: string;
  updatedAt: string;
}

interface EventRegistrationSummary {
  eventId: string;
  title: string;
  status: EventStatus;
  capacity: number;
  confirmed: number;
  cancelled: number;
  remainingSeats: number;
}

interface Group6ValidationResponse {
  data?: {
    exists?: boolean;
    validForReservation?: boolean;
    capacity?: number | null;
    resourceCode?: string | null;
    message?: string;
  };
}

/** `{"all": true}` or `{"roles": [...], "departmentId": "CS", "facultyId": "FSC"}` */
function parseEligibilityRule(rule: string | null | undefined): EligibilityRule {
  try {
    const parsed = JSON.parse(rule || '{}') as { all?: boolean; roles?: string[]; departmentId?: string; facultyId?: string };
    if (parsed.all) return { roles: [], facultyIds: [], departmentIds: [] };
    return {
      roles: (parsed.roles ?? []) as UserRole[],
      facultyIds: parsed.facultyId ? [parsed.facultyId] : [],
      departmentIds: parsed.departmentId ? [parsed.departmentId] : [],
    };
  } catch {
    return { roles: [], facultyIds: [], departmentIds: [] };
  }
}

/** The event-service rule holds one department and one faculty; the form allows only one of each. */
function toEligibilityRule(rule: EligibilityRule): string {
  if (!rule.roles.length && !rule.departmentIds.length && !rule.facultyIds.length) return JSON.stringify({ all: true });
  return JSON.stringify({
    ...(rule.roles.length ? { roles: rule.roles } : {}),
    ...(rule.departmentIds[0] ? { departmentId: rule.departmentIds[0] } : {}),
    ...(rule.facultyIds[0] ? { facultyId: rule.facultyIds[0] } : {}),
  });
}

function toUiEvent(event: EventResponse): UniversityEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? '',
    organizerId: event.organizerId,
    organizerName: event.organizerId,
    mode: event.online ? 'ONLINE' : 'PHYSICAL',
    venueResourceId: event.venue ?? undefined,
    venueName: event.venue ?? undefined,
    startTime: event.scheduleStart,
    endTime: event.scheduleEnd,
    registrationOpensAt: event.registrationOpenAt,
    registrationClosesAt: event.registrationCloseAt,
    capacity: event.capacity,
    // Registration counts come only from the organizer summary endpoint.
    confirmedCount: undefined,
    eligibility: parseEligibilityRule(event.eligibilityRule),
    status: event.status,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function toBackendEvent(request: EventUpsertRequest) {
  return {
    title: request.title,
    description: request.description,
    online: request.mode === 'ONLINE',
    venue: request.mode === 'PHYSICAL' ? request.venueResourceId : null,
    scheduleStart: toBackendLocalDateTime(request.startTime),
    scheduleEnd: toBackendLocalDateTime(request.endTime),
    registrationOpenAt: toBackendLocalDateTime(request.registrationOpensAt),
    registrationCloseAt: toBackendLocalDateTime(request.registrationClosesAt),
    capacity: request.capacity,
    eligibilityRule: toEligibilityRule(request.eligibility),
  };
}

async function toUiRegistration(registration: RegistrationResponse, known?: UniversityEvent): Promise<Registration> {
  let event = known;
  if (!event) {
    const result = await getEvent(registration.eventId);
    event = result.ok ? result.data : undefined;
  }
  return {
    id: registration.id,
    eventId: registration.eventId,
    eventTitle: event?.title ?? 'Event',
    eventStartTime: event?.startTime ?? registration.createdAt,
    eventStatus: event?.status ?? 'PUBLISHED',
    registrationClosesAt: event?.registrationClosesAt ?? registration.createdAt,
    userId: registration.userId,
    status: registration.status,
    registeredAt: registration.createdAt,
    cancelledAt: registration.status === 'CANCELLED' ? registration.updatedAt : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Synthetic demo data (used only when the gateway is unreachable)     */
/* ------------------------------------------------------------------ */

const DAY = 24 * 60 * 60 * 1000;
const at = (days: number, hour = 9): string => {
  const date = new Date(Date.now() + days * DAY);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const OPEN_TO_ALL = { roles: [], facultyIds: [], departmentIds: [] };

const DEMO_VENUES: Record<string, VenueValidationResult> = {
  'RES-101': { valid: true, venueName: 'Science Auditorium', capacity: 300 },
  'RES-204': { valid: true, venueName: 'Computing Lab B-204', capacity: 40 },
  'RES-310': { valid: true, venueName: 'Main Library Seminar Room', capacity: 60 },
  'LAB-101': { valid: true, venueName: 'LAB-101', capacity: 30 },
  'AUD-A': { valid: true, venueName: 'AUD-A', capacity: 300 },
  'RES-555': { valid: false, venueName: 'Old Physics Hall', reason: 'Resource is inactive (under maintenance) in Facility Services.' },
};

const demoEvents: UniversityEvent[] = [
  {
    id: 'EVT-1001',
    title: 'Innovation Week Workshop',
    description:
      'Hands-on workshop on rapid prototyping, design thinking and pitching. Teams of 3-4 build a working demo in one day.',
    organizerId: 'USR-STAFF-01',
    organizerName: 'Dr. K. Perera',
    mode: 'PHYSICAL',
    venueResourceId: 'RES-204',
    venueName: 'Computing Lab B-204',
    startTime: at(6, 9),
    endTime: at(6, 16),
    registrationOpensAt: at(-5),
    registrationClosesAt: at(4, 23),
    capacity: 40,
    confirmedCount: 18,
    eligibility: { roles: ['STUDENT', 'ACADEMIC_STAFF'], facultyIds: [], departmentIds: [] },
    status: 'PUBLISHED',
  },
  {
    id: 'EVT-1002',
    title: 'Industry Career Fair 2026',
    description: 'Meet 30+ employers, attend CV clinics and book mock interviews with industry mentors.',
    organizerId: 'USR-STAFF-02',
    organizerName: 'Career Guidance Unit',
    mode: 'PHYSICAL',
    venueResourceId: 'RES-101',
    venueName: 'Science Auditorium',
    startTime: at(9, 10),
    endTime: at(9, 15),
    registrationOpensAt: at(-10),
    registrationClosesAt: at(7, 23),
    capacity: 2,
    confirmedCount: 2,
    eligibility: OPEN_TO_ALL,
    status: 'PUBLISHED',
  },
  {
    id: 'EVT-1003',
    title: 'Postgraduate Research Symposium',
    description: 'Annual symposium where postgraduate researchers present work in progress.',
    organizerId: 'USR-STAFF-03',
    organizerName: 'Faculty of Science',
    mode: 'PHYSICAL',
    venueResourceId: 'RES-310',
    venueName: 'Main Library Seminar Room',
    startTime: at(3, 9),
    endTime: at(3, 13),
    registrationOpensAt: at(-20),
    registrationClosesAt: at(-1, 17),
    capacity: 60,
    confirmedCount: 41,
    eligibility: OPEN_TO_ALL,
    status: 'PUBLISHED',
  },
  {
    id: 'EVT-1004',
    title: 'Cloud Computing Webinar (Staff CPD)',
    description: 'Continuing professional development session on cloud-native architecture for academic staff.',
    organizerId: 'USR-STAFF-01',
    organizerName: 'Dr. K. Perera',
    mode: 'ONLINE',
    onlineLink: 'https://meet.example.edu/cloud-cpd',
    startTime: at(5, 14),
    endTime: at(5, 16),
    registrationOpensAt: at(-2),
    registrationClosesAt: at(4, 12),
    capacity: 100,
    confirmedCount: 22,
    eligibility: { roles: ['ACADEMIC_STAFF', 'ADMINISTRATIVE_STAFF', 'EVENT_ORGANIZER', 'ADMIN'], facultyIds: [], departmentIds: [] },
    status: 'PUBLISHED',
  },
  {
    id: 'EVT-1005',
    title: 'Sports Day Opening Ceremony',
    description: 'Opening ceremony for the inter-faculty sports meet.',
    organizerId: 'USR-STAFF-04',
    organizerName: 'Physical Education Unit',
    mode: 'PHYSICAL',
    venueResourceId: 'RES-101',
    venueName: 'Science Auditorium',
    startTime: at(2, 8),
    endTime: at(2, 11),
    registrationOpensAt: at(-7),
    registrationClosesAt: at(1),
    capacity: 250,
    confirmedCount: 0,
    eligibility: OPEN_TO_ALL,
    status: 'CANCELLED',
  },
  {
    id: 'EVT-1006',
    title: 'Freshers Orientation: Digital Services',
    description: 'Introduction to LMS, email, library e-resources and the University Services Platform.',
    organizerId: 'USR-STAFF-02',
    organizerName: 'IT Services Unit',
    mode: 'PHYSICAL',
    venueResourceId: 'RES-101',
    venueName: 'Science Auditorium',
    startTime: at(-6, 9),
    endTime: at(-6, 12),
    registrationOpensAt: at(-20),
    registrationClosesAt: at(-7),
    capacity: 300,
    confirmedCount: 212,
    eligibility: OPEN_TO_ALL,
    status: 'COMPLETED',
  },
  {
    id: 'EVT-1007',
    title: 'Hackathon Mentor Briefing',
    description: 'Draft - briefing for mentors of the upcoming hackathon.',
    organizerId: 'USR-STAFF-01',
    organizerName: 'Dr. K. Perera',
    mode: 'ONLINE',
    onlineLink: 'https://meet.example.edu/hack-mentors',
    startTime: at(12, 15),
    endTime: at(12, 16),
    registrationOpensAt: at(1),
    registrationClosesAt: at(11),
    capacity: 25,
    confirmedCount: 0,
    eligibility: { roles: ['ACADEMIC_STAFF', 'EVENT_ORGANIZER'], facultyIds: [], departmentIds: [] },
    status: 'DRAFT',
  },
];

const demoRegistrations: Registration[] = [
  {
    id: 'REG-5001',
    eventId: 'EVT-1001',
    eventTitle: 'Innovation Week Workshop',
    eventStartTime: demoEvents[0].startTime,
    eventStatus: 'PUBLISHED',
    registrationClosesAt: demoEvents[0].registrationClosesAt,
    userId: 'demo-user',
    status: 'CONFIRMED',
    registeredAt: at(-3, 11),
  },
  {
    id: 'REG-5002',
    eventId: 'EVT-1006',
    eventTitle: 'Freshers Orientation: Digital Services',
    eventStartTime: demoEvents[5].startTime,
    eventStatus: 'COMPLETED',
    registrationClosesAt: demoEvents[5].registrationClosesAt,
    userId: 'demo-user',
    status: 'CONFIRMED',
    registeredAt: at(-15, 10),
  },
  {
    id: 'REG-5003',
    eventId: 'EVT-1005',
    eventTitle: 'Sports Day Opening Ceremony',
    eventStartTime: demoEvents[4].startTime,
    eventStatus: 'CANCELLED',
    registrationClosesAt: demoEvents[4].registrationClosesAt,
    userId: 'demo-user',
    status: 'CANCELLED',
    registeredAt: at(-5, 15),
    cancelledAt: at(-1, 9),
  },
];

const demoRoles = (): UserRole[] => getG8DemoIdentity()?.roles ?? ['STUDENT'];
const isDemoOrganizer = () => demoRoles().some((role) => EVENT_ORGANIZER_ROLES.includes(role));
const roleAllowed = (event: UniversityEvent) =>
  event.eligibility.roles.length === 0 || event.eligibility.roles.some((role) => demoRoles().includes(role));

const findDemoEvent = (id: string) => demoEvents.find((event) => event.id === id);

function validateDemoUpsert(request: EventUpsertRequest): string | null {
  if (!request.title.trim()) return 'Title is required.';
  if (!Number.isInteger(request.capacity) || request.capacity <= 0) return 'Capacity must be a positive whole number.';
  if (new Date(request.endTime) <= new Date(request.startTime)) return 'Event end time must be after the start time.';
  if (new Date(request.registrationClosesAt) <= new Date(request.registrationOpensAt)) {
    return 'Registration must close after it opens.';
  }
  if (new Date(request.registrationClosesAt) > new Date(request.startTime)) {
    return 'Registration must close before the event starts.';
  }
  if (request.mode === 'PHYSICAL' && !request.venueResourceId) return 'A venue is required for a physical event.';
  if (request.mode === 'ONLINE' && !request.onlineLink) return 'An online meeting link is required for an online event.';
  return null;
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export interface EventListFilters {
  status?: EventStatus | '';
  search?: string;
  scope?: 'all' | 'mine';
}

export function listEvents(filters: EventListFilters = {}): Promise<G8Result<UniversityEvent[]>> {
  const query = toQuery({ status: filters.status || undefined, mine: filters.scope === 'mine' ? 'true' : undefined });
  const search = filters.search?.trim().toLowerCase();
  return g8RequestMapped<EventResponse[], UniversityEvent[]>(
    `${EVENTS_API}${query}`,
    {
    demo: () => {
      const data = demoEvents.filter((event) => {
        // Drafts are only visible to organizers; published events only to eligible roles (US8-01 AC).
        if (event.status === 'DRAFT' && !isDemoOrganizer()) return false;
        if (!isDemoOrganizer() && !roleAllowed(event)) return false;
        if (filters.status && event.status !== filters.status) return false;
        if (search && !`${event.title} ${event.description} ${event.venueName ?? ''}`.toLowerCase().includes(search)) {
          return false;
        }
        return true;
      });
      return g8Ok([...data].sort((a, b) => a.startTime.localeCompare(b.startTime)), true);
    },
    },
    (events) =>
      events
        .map(toUiEvent)
        .filter((event) => !search || `${event.title} ${event.description} ${event.venueName ?? ''}`.toLowerCase().includes(search))
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
  );
}

export function getEvent(eventId: string): Promise<G8Result<UniversityEvent>> {
  return g8RequestMapped<EventResponse, UniversityEvent>(
    `${EVENTS_API}/${encodeURIComponent(eventId)}`,
    {
    demo: () => {
      const event = findDemoEvent(eventId);
      if (!event || (event.status === 'DRAFT' && !isDemoOrganizer())) {
        return g8Fail(404, 'This event does not exist or is not available to you.', true);
      }
      return g8Ok({ ...event }, true);
    },
    },
    toUiEvent
  );
}

export function createEvent(request: EventUpsertRequest): Promise<G8Result<UniversityEvent>> {
  return g8RequestMapped<EventResponse, UniversityEvent>(EVENTS_API, {
    method: 'POST',
    body: toBackendEvent(request),
    demo: () => {
      if (!isDemoOrganizer()) return g8Fail(403, 'Only authorized event organizers can create events.', true);
      const problem = validateDemoUpsert(request);
      if (problem) return g8Fail(400, problem, true);
      const venue = request.venueResourceId ? DEMO_VENUES[request.venueResourceId] : undefined;
      const identity = getG8DemoIdentity();
      const event: UniversityEvent = {
        ...request,
        id: nextDemoId('EVT'),
        organizerId: identity?.id ?? 'demo-user',
        organizerName: identity ? `${identity.firstName} ${identity.lastName}` : 'Demo Organizer',
        venueName: venue?.venueName,
        confirmedCount: 0,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
      };
      demoEvents.push(event);
      return g8Ok({ ...event }, true);
    },
  }, toUiEvent);
}

export function updateEvent(eventId: string, request: EventUpsertRequest): Promise<G8Result<UniversityEvent>> {
  return g8RequestMapped<EventResponse, UniversityEvent>(`${EVENTS_API}/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: toBackendEvent(request),
    demo: () => {
      const event = findDemoEvent(eventId);
      if (!event) return g8Fail(404, undefined, true);
      if (!isDemoOrganizer()) return g8Fail(403, 'Only the organizer can edit this event.', true);
      if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
        return g8Fail(409, `A ${event.status.toLowerCase()} event can no longer be edited.`, true);
      }
      const problem = validateDemoUpsert(request);
      if (problem) return g8Fail(400, problem, true);
      if (request.capacity < (event.confirmedCount ?? 0)) {
        return g8Fail(409, `Capacity cannot be lower than the ${event.confirmedCount} confirmed registrations.`, true);
      }
      const venue = request.venueResourceId ? DEMO_VENUES[request.venueResourceId] : undefined;
      Object.assign(event, request, { venueName: venue?.venueName, updatedAt: new Date().toISOString() });
      return g8Ok({ ...event }, true);
    },
  }, toUiEvent);
}

export function publishEvent(eventId: string): Promise<G8Result<UniversityEvent>> {
  return g8RequestMapped<EventResponse, UniversityEvent>(`${EVENTS_API}/${encodeURIComponent(eventId)}/publish`, {
    method: 'PATCH',
    demo: () => {
      const event = findDemoEvent(eventId);
      if (!event) return g8Fail(404, undefined, true);
      if (!isDemoOrganizer()) return g8Fail(403, 'Only authorized organizers can publish events.', true);
      if (event.status !== 'DRAFT') return g8Fail(409, 'Only draft events can be published.', true);
      if (event.mode === 'PHYSICAL') {
        const venue = event.venueResourceId ? DEMO_VENUES[event.venueResourceId] : undefined;
        if (!venue?.valid) {
          return g8Fail(409, `Venue validation failed: ${venue?.reason ?? 'venue not found in Facility Services.'}`, true);
        }
      }
      event.status = 'PUBLISHED';
      return g8Ok({ ...event }, true);
    },
  }, toUiEvent);
}

export function cancelEvent(eventId: string): Promise<G8Result<UniversityEvent>> {
  return g8RequestMapped<EventResponse, UniversityEvent>(`${EVENTS_API}/${encodeURIComponent(eventId)}/cancel`, {
    method: 'PATCH',
    demo: () => {
      const event = findDemoEvent(eventId);
      if (!event) return g8Fail(404, undefined, true);
      if (!isDemoOrganizer()) return g8Fail(403, 'Only the organizer can cancel this event.', true);
      if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
        return g8Fail(409, `This event is already ${event.status.toLowerCase()}.`, true);
      }
      event.status = 'CANCELLED';
      // BR8-04: all active registrations are cancelled and registrants notified server-side.
      demoRegistrations
        .filter((registration) => registration.eventId === eventId && registration.status !== 'CANCELLED')
        .forEach((registration) => {
          registration.status = 'CANCELLED';
          registration.eventStatus = 'CANCELLED';
          registration.cancelledAt = new Date().toISOString();
          recordDemoNotification({
            type: 'EVENT_CANCELLED',
            title: 'Event cancelled',
            message: `"${event.title}" was cancelled by the organizer.`,
            source: 'GROUP8_EVENTS',
            referenceId: event.id,
          });
        });
      event.confirmedCount = 0;
      return g8Ok({ ...event }, true);
    },
  }, toUiEvent);
}

export function completeEvent(eventId: string): Promise<G8Result<UniversityEvent>> {
  return g8RequestMapped<EventResponse, UniversityEvent>(
    `${EVENTS_API}/${encodeURIComponent(eventId)}/complete`,
    {
      method: 'PATCH',
      demo: () => {
        const event = findDemoEvent(eventId);
        if (!event) return g8Fail(404, undefined, true);
        if (!isDemoOrganizer()) return g8Fail(403, 'Only the organizer can complete this event.', true);
        if (event.status !== 'PUBLISHED') return g8Fail(400, 'Only published events can be completed.', true);
        if (Date.now() < new Date(event.startTime).getTime()) {
          return g8Fail(400, 'An event cannot be completed before it starts.', true);
        }
        event.status = 'COMPLETED';
        return g8Ok({ ...event }, true);
      },
    },
    toUiEvent
  );
}

export function validateVenue(resourceId: string): Promise<G8Result<VenueValidationResult>> {
  const code = resourceId.trim().toUpperCase();
  return g8RequestMapped<Group6ValidationResponse, VenueValidationResult>(`/resources/code/${encodeURIComponent(code)}/validate`, {
    demo: () =>
      g8Ok(
        DEMO_VENUES[resourceId.trim().toUpperCase()] ?? {
          valid: false,
          reason: 'No facility or resource with this ID exists in Facility Services (Group 6).',
        },
        true
      ),
  }, (response) => ({
    valid: Boolean(response.data?.validForReservation),
    venueName: response.data?.resourceCode ?? code,
    capacity: response.data?.capacity ?? undefined,
    reason: response.data?.validForReservation ? undefined : response.data?.message,
  }));
}

/* ------------------------------------------------------------------ */
/* Registrations                                                       */
/* ------------------------------------------------------------------ */

export function registerForEvent(eventId: string): Promise<G8Result<Registration>> {
  return g8RequestMapped<RegistrationResponse, Registration>(`${EVENTS_API}/${encodeURIComponent(eventId)}/registrations`, {
    method: 'POST',
    demo: () => {
      const event = findDemoEvent(eventId);
      if (!event) return g8Fail(404, undefined, true);
      if (event.status === 'CANCELLED') return g8Fail(409, 'This event has been cancelled - registration is closed.', true);
      if (event.status !== 'PUBLISHED') return g8Fail(409, 'This event is not open for registration.', true);
      const now = Date.now();
      if (now < new Date(event.registrationOpensAt).getTime()) {
        return g8Fail(409, 'Registration has not opened yet for this event.', true);
      }
      if (now > new Date(event.registrationClosesAt).getTime()) {
        return g8Fail(409, 'The registration period for this event has ended.', true);
      }
      if (!roleAllowed(event)) {
        return g8Fail(
          403,
          `You are not eligible for this event. It is restricted to: ${event.eligibility.roles.join(', ')}.`,
          true
        );
      }
      const existing = demoRegistrations.find(
        (registration) => registration.eventId === eventId && registration.status !== 'CANCELLED'
      );
      if (existing) return g8Fail(409, 'You are already registered for this event.', true);
      if ((event.confirmedCount ?? 0) >= event.capacity) {
        return g8Fail(409, 'Capacity reached - registration is closed for this event.', true);
      }
      event.confirmedCount = (event.confirmedCount ?? 0) + 1;
      const registration: Registration = {
        id: nextDemoId('REG'),
        eventId,
        eventTitle: event.title,
        eventStartTime: event.startTime,
        eventStatus: event.status,
        registrationClosesAt: event.registrationClosesAt,
        userId: getG8DemoIdentity()?.id ?? 'demo-user',
        status: 'CONFIRMED',
        registeredAt: new Date().toISOString(),
      };
      demoRegistrations.unshift(registration);
      recordDemoNotification({
        type: 'REGISTRATION_CONFIRMED',
        title: 'Registration confirmed',
        message: `You are registered for "${event.title}".`,
        source: 'GROUP8_EVENTS',
        referenceId: event.id,
      });
      return g8Ok({ ...registration }, true);
    },
  }, (registration) => toUiRegistration(registration));
}

export function getMyRegistrations(): Promise<G8Result<Registration[]>> {
  return g8RequestMapped<RegistrationResponse[], Registration[]>(`${REGISTRATIONS_API}/mine`, {
    demo: () => g8Ok(demoRegistrations.map((registration) => ({ ...registration })), true),
  }, async (registrations) => {
    // One event lookup per distinct event, then join titles/dates onto each registration.
    const eventIds = [...new Set(registrations.map((registration) => registration.eventId))];
    const events = await Promise.all(eventIds.map((id) => getEvent(id)));
    const byId = new Map(events.flatMap((result) => (result.ok ? [[result.data.id, result.data] as const] : [])));
    return Promise.all(registrations.map((registration) => toUiRegistration(registration, byId.get(registration.eventId))));
  });
}

export function cancelRegistration(registrationId: string): Promise<G8Result<Registration>> {
  return g8RequestMapped<RegistrationResponse, Registration>(`${REGISTRATIONS_API}/${encodeURIComponent(registrationId)}/cancel`, {
    method: 'PATCH',
    demo: () => {
      const registration = demoRegistrations.find((item) => item.id === registrationId);
      if (!registration) return g8Fail(404, undefined, true);
      if (registration.status === 'CANCELLED') return g8Fail(409, 'This registration is already cancelled.', true);
      if (Date.now() > new Date(registration.registrationClosesAt).getTime()) {
        return g8Fail(409, 'The cancellation deadline has passed for this event.', true);
      }
      registration.status = 'CANCELLED';
      registration.cancelledAt = new Date().toISOString();
      const event = findDemoEvent(registration.eventId);
      if (event) event.confirmedCount = Math.max(0, (event.confirmedCount ?? 0) - 1);
      recordDemoNotification({
        type: 'REGISTRATION_CANCELLED',
        title: 'Registration cancelled',
        message: `Your registration for "${registration.eventTitle}" was cancelled and your place released.`,
        source: 'GROUP8_EVENTS',
        referenceId: registration.eventId,
      });
      return g8Ok({ ...registration }, true);
    },
  }, (registration) => toUiRegistration(registration));
}

export function getRegistrationSummary(eventId: string): Promise<G8Result<RegistrationSummary>> {
  return g8RequestMapped<EventRegistrationSummary, RegistrationSummary>(`${EVENTS_API}/${encodeURIComponent(eventId)}/registrations`, {
    demo: () => {
      const event = findDemoEvent(eventId);
      if (!event) return g8Fail(404, undefined, true);
      if (!isDemoOrganizer()) return g8Fail(403, 'Only organizers can view registration summaries.', true);
      const names = ['Nimal Silva', 'Ayesha Fernando', 'Kavindu Jayasuriya', 'Tharushi Perera', 'Sahan Rathnayake', 'Dilini Wickramasinghe'];
      const departments = ['Computing', 'Mathematics', 'Physics', 'Statistics'];
      const shown = Math.min(event.confirmedCount ?? 0, names.length);
      const registrants = Array.from({ length: shown }, (_, index) => ({
        registrationId: `REG-S${index + 1}`,
        userId: `USR-DEMO-${index + 1}`,
        displayName: names[index],
        departmentName: departments[index % departments.length],
        status: 'CONFIRMED' as const,
        registeredAt: at(-index - 1, 10 + index),
      }));
      return g8Ok(
        {
          eventId,
          capacity: event.capacity,
          confirmed: event.confirmedCount ?? 0,
          waitlisted: 0,
          cancelled: demoRegistrations.filter(
            (registration) => registration.eventId === eventId && registration.status === 'CANCELLED'
          ).length,
          registrants,
        },
        true
      );
    },
  }, (summary) => ({
    eventId: summary.eventId,
    capacity: summary.capacity,
    confirmed: summary.confirmed,
    waitlisted: 0,
    cancelled: summary.cancelled,
    // The event-service summary gives counts only; it does not expose registrant names.
    registrants: [],
  }));
}
