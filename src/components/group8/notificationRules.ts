import type { AppNotification, NotificationSource } from '@/types';

export const NOTIFICATION_SOURCE_LABEL: Record<NotificationSource, string> = {
  GROUP8_EVENTS: 'Events',
  GROUP8_COMMS: 'Announcements',
  GROUP6: 'Facilities & Reservations',
  GROUP7: 'Service Desk',
};

/** In-app deep link for a notification, when the target screen exists in this frontend. */
export function notificationLink(notification: AppNotification): string | null {
  if (!notification.referenceId) return null;
  switch (notification.type) {
    case 'REGISTRATION_CONFIRMED':
    case 'REGISTRATION_CANCELLED':
    case 'EVENT_UPDATED':
    case 'EVENT_CANCELLED':
      return `/events/${notification.referenceId}`;
    case 'ANNOUNCEMENT_PUBLISHED':
      return '/announcements';
    default:
      return null;
  }
}
