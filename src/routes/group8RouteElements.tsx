import type React from 'react';
import {
  AnnouncementFormPage,
  AnnouncementsPage,
  EngagementDashboardPage,
  EventDetailPage,
  EventFormPage,
  EventsPage,
  FeedbackFormPage,
  FeedbackPage,
  FeedbackSummaryPage,
  MyRegistrationsPage,
  NotificationsPage,
} from '@/pages/group8';

/**
 * Group 8 route path -> page element. Paths must match GROUP8_ROUTES_CONFIG.
 * Returns null for paths owned by other groups.
 */
const GROUP8_ROUTE_ELEMENTS: Record<string, () => React.ReactElement> = {
  '/events': () => <EventsPage />,
  '/events/new': () => <EventFormPage />,
  '/events/:eventId': () => <EventDetailPage />,
  '/events/:eventId/edit': () => <EventFormPage />,
  '/registrations': () => <MyRegistrationsPage />,
  '/announcements': () => <AnnouncementsPage />,
  '/announcements/new': () => <AnnouncementFormPage />,
  '/notifications': () => <NotificationsPage />,
  '/feedback': () => <FeedbackPage />,
  '/feedback/summary': () => <FeedbackSummaryPage />,
  '/engagement-dashboard': () => <EngagementDashboardPage />,
  '/feedback/:activityType/:activityId': () => <FeedbackFormPage />,
};

export function renderGroup8Page(path: string): React.ReactElement | null {
  const render = GROUP8_ROUTE_ELEMENTS[path];
  return render ? render() : null;
}
