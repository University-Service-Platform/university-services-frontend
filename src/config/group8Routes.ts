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

/** Event organizers: academic & administrative staff (BR8-01). */
export const G8_ORGANIZER_ROLES: UserRole[] = ['ADMIN', 'STAFF', 'HOD', 'DEAN'];
/** Staff allowed to publish targeted announcements (US8-08). */
export const G8_ANNOUNCER_ROLES: UserRole[] = ['ADMIN', 'STAFF'];
/** Staff allowed to view feedback summaries and the engagement dashboard (US8-13). */
export const G8_INSIGHT_ROLES: UserRole[] = ['ADMIN', 'STAFF', 'HOD', 'DEAN'];

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
