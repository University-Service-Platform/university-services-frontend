import type {
  Announcement,
  AnnouncementCreateRequest,
  AppNotification,
  AudiencePreview,
  AudienceRule,
  UserRole,
} from '@/types';
import { g8Fail, g8Ok, g8Request, getG8DemoIdentity, nextDemoId, type G8Result } from './g8Api';

/**
 * communication-feedback-service client - announcements & notifications (Group 8)
 *
 * GROUP 8 DRAFT CONTRACT - gateway paths:
 *   GET    /announcements                      announcements targeted at the caller (BR8-06, filtered server-side)
 *   GET    /announcements/managed              announcements the caller authored / may manage (staff)
 *   POST   /announcements                      create (optionally publish immediately)
 *   POST   /announcements/{id}/publish         publish a draft -> notifications for the audience
 *   POST   /announcements/audience-preview     estimated recipients for an audience rule (Group 5 directory)
 *   GET    /notifications/me                   caller's in-app notifications (newest first)
 *   PATCH  /notifications/{id}/read            mark one notification read
 *   PATCH  /notifications/me/read-all          mark all read
 *
 * Provided to Groups 6/7 (service-to-service, not called by the frontend):
 *   POST   /notifications                      { recipientId, type, title, message, source, referenceId }
 */

export const ANNOUNCEMENTS_API = '/announcements';
export const NOTIFICATIONS_API = '/notifications';

/** Roles allowed to publish announcements (US8-08). Final check is server-side. */
export const ANNOUNCER_ROLES: UserRole[] = ['ADMIN', 'STAFF'];

/* ------------------------------------------------------------------ */
/* Synthetic demo data                                                 */
/* ------------------------------------------------------------------ */

const HOUR = 60 * 60 * 1000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();

const demoAnnouncements: Announcement[] = [
  {
    id: 'ANN-2001',
    title: 'Semester 2 examination timetable released',
    content:
      'The provisional examination timetable for Semester 2 is now available on the LMS. Report clashes to your faculty office before 10 October.',
    audience: { type: 'ALL', values: [] },
    publisherId: 'USR-STAFF-10',
    publisherName: 'Examinations Division',
    status: 'PUBLISHED',
    publishedAt: ago(5),
    createdAt: ago(6),
  },
  {
    id: 'ANN-2002',
    title: 'Computing lab maintenance this Saturday',
    content: 'Labs B-201 to B-204 will be closed on Saturday 08:00-14:00 for network upgrades. Remote desktop remains available.',
    audience: { type: 'DEPARTMENT', values: ['DEP-CS'] },
    publisherId: 'USR-STAFF-01',
    publisherName: 'Dr. K. Perera',
    status: 'PUBLISHED',
    publishedAt: ago(28),
    createdAt: ago(30),
  },
  {
    id: 'ANN-2003',
    title: 'Staff CPD: research grant writing clinic',
    content: 'A two-hour clinic on competitive research grant applications for academic staff. Register via the Events page.',
    audience: { type: 'ROLE', values: ['STAFF', 'HOD', 'DEAN'] },
    publisherId: 'USR-STAFF-11',
    publisherName: 'Research Council Office',
    status: 'PUBLISHED',
    publishedAt: ago(52),
    createdAt: ago(53),
  },
  {
    id: 'ANN-2004',
    title: 'Library extended opening hours',
    content: 'The main library will stay open until 22:00 during the examination period.',
    audience: { type: 'SERVICE_UNIT', values: ['SU-LIB'] },
    publisherId: 'USR-STAFF-12',
    publisherName: 'Library Services',
    status: 'DRAFT',
    createdAt: ago(2),
  },
];

const demoNotifications: AppNotification[] = [
  {
    id: 'NTF-3001',
    recipientId: 'demo-user',
    type: 'REGISTRATION_CONFIRMED',
    title: 'Registration confirmed',
    message: 'You are registered for "Innovation Week Workshop".',
    source: 'GROUP8_EVENTS',
    referenceId: 'EVT-1001',
    read: false,
    createdAt: ago(1),
  },
  {
    id: 'NTF-3002',
    recipientId: 'demo-user',
    type: 'SERVICE_REQUEST_STATUS',
    title: 'Service request resolved',
    message: 'Your request REQ-2026-004 "Software license request for MATLAB" was marked Resolved by the service desk.',
    source: 'GROUP7',
    referenceId: 'REQ-2026-004',
    read: false,
    createdAt: ago(4),
  },
  {
    id: 'NTF-3003',
    recipientId: 'demo-user',
    type: 'ANNOUNCEMENT_PUBLISHED',
    title: 'New announcement',
    message: 'Semester 2 examination timetable released.',
    source: 'GROUP8_COMMS',
    referenceId: 'ANN-2001',
    read: false,
    createdAt: ago(5),
  },
  {
    id: 'NTF-3004',
    recipientId: 'demo-user',
    type: 'RESERVATION_STATUS',
    title: 'Reservation approved',
    message: 'Your reservation of Seminar Room 2 on 3 Oct, 10:00-12:00 was approved.',
    source: 'GROUP6',
    referenceId: 'RSV-7781',
    read: true,
    createdAt: ago(26),
  },
  {
    id: 'NTF-3005',
    recipientId: 'demo-user',
    type: 'EVENT_CANCELLED',
    title: 'Event cancelled',
    message: '"Sports Day Opening Ceremony" was cancelled by the organizer: venue unavailable due to weather damage.',
    source: 'GROUP8_EVENTS',
    referenceId: 'EVT-1005',
    read: true,
    createdAt: ago(30),
  },
];

/** Adds a notification to the synthetic inbox (demo stand-in for server-side triggers). */
export function recordDemoNotification(
  notification: Omit<AppNotification, 'id' | 'recipientId' | 'read' | 'createdAt'>
): void {
  demoNotifications.unshift({
    ...notification,
    id: nextDemoId('NTF'),
    recipientId: getG8DemoIdentity()?.id ?? 'demo-user',
    read: false,
    createdAt: new Date().toISOString(),
  });
}

/** Directory-backed estimate stand-in (Group 5 provides real counts). */
const DEMO_AUDIENCE_SIZES: Record<string, number> = {
  STUDENT: 4200,
  STAFF: 520,
  HOD: 38,
  DEAN: 7,
  ADMIN: 12,
  'FAC-SCI': 1450,
  'FAC-CMS': 980,
  'FAC-HUM': 1210,
  'DEP-CS': 610,
  'DEP-MATH': 240,
  'DEP-PHY': 190,
  'SU-LIB': 45,
  'SU-IT': 30,
  'SU-EXAM': 18,
};

const isDemoAnnouncer = () => (getG8DemoIdentity()?.roles ?? []).some((role) => ANNOUNCER_ROLES.includes(role));

/** Whether an audience rule matches the demo identity (server-side in production - BR8-06). */
function demoAudienceMatches(audience: AudienceRule): boolean {
  const identity = getG8DemoIdentity();
  if (audience.type === 'ALL') return true;
  if (!identity) return false;
  switch (audience.type) {
    case 'ROLE':
      return identity.roles.some((role) => audience.values.includes(role));
    case 'FACULTY':
      return Boolean(identity.facultyId && audience.values.includes(identity.facultyId));
    case 'DEPARTMENT':
      return Boolean(
        (identity.departmentId && audience.values.includes(identity.departmentId)) ||
          (identity.departmentName === 'Computing' && audience.values.includes('DEP-CS'))
      );
    case 'SERVICE_UNIT':
      return Boolean(identity.serviceUnitId && audience.values.includes(identity.serviceUnitId));
    default:
      return false;
  }
}

function validateAudience(audience: AudienceRule): string | null {
  if (!audience.type) return 'Choose who should receive this announcement.';
  if (audience.type !== 'ALL' && audience.values.length === 0) {
    return 'Select at least one audience value, or target all users.';
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export function listMyAnnouncements(): Promise<G8Result<Announcement[]>> {
  return g8Request<Announcement[]>(ANNOUNCEMENTS_API, {
    demo: () =>
      g8Ok(
        demoAnnouncements
          .filter((item) => item.status === 'PUBLISHED' && demoAudienceMatches(item.audience))
          .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
          .map((item) => ({ ...item })),
        true
      ),
  });
}

export function listManagedAnnouncements(): Promise<G8Result<Announcement[]>> {
  return g8Request<Announcement[]>(`${ANNOUNCEMENTS_API}/managed`, {
    demo: () => {
      if (!isDemoAnnouncer()) return g8Fail(403, 'Only authorized staff can manage announcements.', true);
      return g8Ok(
        [...demoAnnouncements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((item) => ({ ...item })),
        true
      );
    },
  });
}

export function previewAudience(audience: AudienceRule): Promise<G8Result<AudiencePreview>> {
  return g8Request<AudiencePreview>(`${ANNOUNCEMENTS_API}/audience-preview`, {
    method: 'POST',
    body: audience,
    demo: () => {
      const problem = validateAudience(audience);
      if (problem) return g8Fail(400, problem, true);
      const estimatedRecipients =
        audience.type === 'ALL'
          ? 5200
          : audience.values.reduce((total, value) => total + (DEMO_AUDIENCE_SIZES[value] ?? 0), 0);
      const description =
        audience.type === 'ALL' ? 'All active university members' : `${audience.type.replace('_', ' ').toLowerCase()}: ${audience.values.join(', ')}`;
      return g8Ok({ estimatedRecipients, description }, true);
    },
  });
}

export function createAnnouncement(request: AnnouncementCreateRequest): Promise<G8Result<Announcement>> {
  return g8Request<Announcement>(ANNOUNCEMENTS_API, {
    method: 'POST',
    body: request,
    demo: () => {
      if (!isDemoAnnouncer()) return g8Fail(403, 'Only authorized staff can publish announcements.', true);
      if (!request.title.trim()) return g8Fail(400, 'A title is required.', true);
      if (request.content.trim().length < 10) return g8Fail(400, 'Announcement content is too short.', true);
      const problem = validateAudience(request.audience);
      if (problem) return g8Fail(400, problem, true);
      const identity = getG8DemoIdentity();
      const now = new Date().toISOString();
      const announcement: Announcement = {
        id: nextDemoId('ANN'),
        title: request.title.trim(),
        content: request.content.trim(),
        audience: request.audience,
        publisherId: identity?.id ?? 'demo-user',
        publisherName: identity ? `${identity.firstName} ${identity.lastName}` : 'Demo Staff',
        status: request.publishNow ? 'PUBLISHED' : 'DRAFT',
        publishedAt: request.publishNow ? now : undefined,
        createdAt: now,
      };
      demoAnnouncements.unshift(announcement);
      if (request.publishNow && demoAudienceMatches(announcement.audience)) {
        recordDemoNotification({
          type: 'ANNOUNCEMENT_PUBLISHED',
          title: 'New announcement',
          message: announcement.title,
          source: 'GROUP8_COMMS',
          referenceId: announcement.id,
        });
      }
      return g8Ok({ ...announcement }, true);
    },
  });
}

export function publishAnnouncement(announcementId: string): Promise<G8Result<Announcement>> {
  return g8Request<Announcement>(`${ANNOUNCEMENTS_API}/${encodeURIComponent(announcementId)}/publish`, {
    method: 'POST',
    demo: () => {
      const announcement = demoAnnouncements.find((item) => item.id === announcementId);
      if (!announcement) return g8Fail(404, undefined, true);
      if (!isDemoAnnouncer()) return g8Fail(403, 'Only authorized staff can publish announcements.', true);
      if (announcement.status !== 'DRAFT') return g8Fail(409, 'Only draft announcements can be published.', true);
      announcement.status = 'PUBLISHED';
      announcement.publishedAt = new Date().toISOString();
      if (demoAudienceMatches(announcement.audience)) {
        recordDemoNotification({
          type: 'ANNOUNCEMENT_PUBLISHED',
          title: 'New announcement',
          message: announcement.title,
          source: 'GROUP8_COMMS',
          referenceId: announcement.id,
        });
      }
      return g8Ok({ ...announcement }, true);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function getMyNotifications(): Promise<G8Result<AppNotification[]>> {
  return g8Request<AppNotification[]>(`${NOTIFICATIONS_API}/me`, {
    demo: () => g8Ok(demoNotifications.map((item) => ({ ...item })), true),
  });
}

export function markNotificationRead(notificationId: string): Promise<G8Result<AppNotification>> {
  return g8Request<AppNotification>(`${NOTIFICATIONS_API}/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
    demo: () => {
      const notification = demoNotifications.find((item) => item.id === notificationId);
      if (!notification) return g8Fail(404, undefined, true);
      notification.read = true;
      return g8Ok({ ...notification }, true);
    },
  });
}

export function markAllNotificationsRead(): Promise<G8Result<{ updated: number }>> {
  return g8Request<{ updated: number }>(`${NOTIFICATIONS_API}/me/read-all`, {
    method: 'PATCH',
    demo: () => {
      const unread = demoNotifications.filter((item) => !item.read);
      unread.forEach((item) => {
        item.read = true;
      });
      return g8Ok({ updated: unread.length }, true);
    },
  });
}
