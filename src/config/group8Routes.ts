import type { UserRole } from '@/types';
import type { RouteNavigationConfig } from './navigationConfig';

/**
 * Group 8 - Events, Communications & Feedback route ownership
 *
 * Merged into APP_ROUTES_CONFIG so the shared sidebar and ProtectedRoute
 * enforce the same role rules as every other group. Role checks here are for
 * navigation/UX only - every protected action is re-authorized by the Group 8
 * services (BR8-09).
 */

/*
 * Role groups use the Group 5 Identity Service role names and match what the Group 8 services
 * enforce, so the UI never offers an action the backend would refuse (USMG8-132).
 */

/** Create/edit/publish/cancel events - event-service MANAGE_ROLES (BR8-01). */
export const G8_ORGANIZER_ROLES: UserRole[] = ['EVENT_ORGANIZER', 'ACADEMIC_STAFF', 'ADMIN'];
/** Per-event registration summary - event-service SummaryController. */
export const G8_REGISTRATION_SUMMARY_ROLES: UserRole[] = [...G8_ORGANIZER_ROLES, 'ADMINISTRATIVE_STAFF'];
/** Publish targeted announcements - Group 5: administrative staff "publishes announcements" (US8-08). */
export const G8_ANNOUNCER_ROLES: UserRole[] = ['ADMINISTRATIVE_STAFF', 'ADMIN'];
/** Feedback summaries and the engagement dashboard (US8-13). */
export const G8_INSIGHT_ROLES: UserRole[] = ['ADMINISTRATIVE_STAFF', 'ADMIN', 'EVENT_ORGANIZER', 'ACADEMIC_STAFF'];

/** Roles an event can be restricted to (event eligibility rule `roles`). */
export const G8_ELIGIBLE_ROLE_OPTIONS: UserRole[] = [
  'STUDENT',
  'ACADEMIC_STAFF',
  'ADMINISTRATIVE_STAFF',
  'EVENT_ORGANIZER',
  'SERVICE_DESK_OFFICER',
  'TECHNICIAN',
  'RESOURCE_MANAGER',
  'ADMIN',
];

export const GROUP8_ROUTES_CONFIG: RouteNavigationConfig[] = [
  {
    id: 'g8-events',
    path: '/events',
    label: 'Events',
    iconName: 'CalendarDays',
    showInNav: true,
  },
  {
    id: 'g8-event-create',
    path: '/events/new',
    label: 'Create Event',
    iconName: 'CalendarDays',
    requiredRoles: G8_ORGANIZER_ROLES,
    showInNav: false,
  },
  {
    id: 'g8-event-detail',
    path: '/events/:eventId',
    label: 'Event Detail',
    iconName: 'CalendarDays',
    showInNav: false,
  },
  {
    id: 'g8-event-edit',
    path: '/events/:eventId/edit',
    label: 'Edit Event',
    iconName: 'CalendarDays',
    requiredRoles: G8_ORGANIZER_ROLES,
    showInNav: false,
  },
  {
    id: 'g8-registrations',
    path: '/registrations',
    label: 'My Registrations',
    iconName: 'Ticket',
    showInNav: true,
  },
  {
    id: 'g8-announcements',
    path: '/announcements',
    label: 'Announcements',
    iconName: 'Megaphone',
    showInNav: true,
  },
  {
    id: 'g8-announcement-create',
    path: '/announcements/new',
    label: 'New Announcement',
    iconName: 'Megaphone',
    requiredRoles: G8_ANNOUNCER_ROLES,
    showInNav: false,
  },
  {
    id: 'g8-notifications',
    path: '/notifications',
    label: 'Notifications',
    iconName: 'Bell',
    showInNav: true,
  },
  {
    id: 'g8-feedback',
    path: '/feedback',
    label: 'Feedback',
    iconName: 'MessageSquareText',
    showInNav: true,
  },
  {
    id: 'g8-feedback-summary',
    path: '/feedback/summary',
    label: 'Feedback Summary',
    iconName: 'BarChart3',
    requiredRoles: G8_INSIGHT_ROLES,
    showInNav: false,
  },
  {
    id: 'g8-feedback-form',
    path: '/feedback/:activityType/:activityId',
    label: 'Give Feedback',
    iconName: 'MessageSquareText',
    showInNav: false,
  },
  {
    id: 'g8-engagement-dashboard',
    path: '/engagement-dashboard',
    label: 'Engagement',
    iconName: 'BarChart3',
    requiredRoles: G8_INSIGHT_ROLES,
    showInNav: true,
  },
];
