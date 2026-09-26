import type React from 'react';
import { EventDetailPage, EventFormPage, EventsPage, MyRegistrationsPage } from '@/pages/group8';

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
};

export function renderGroup8Page(path: string): React.ReactElement | null {
  const render = GROUP8_ROUTE_ELEMENTS[path];
  return render ? render() : null;
}
