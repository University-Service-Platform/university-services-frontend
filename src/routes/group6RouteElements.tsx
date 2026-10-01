import type React from 'react';
import {
  BrowseFacilitiesPage,
  BookResourcePage,
  MyReservationsPage,
  ApprovalQueuePage,
  ManageFacilitiesPage,
} from '@/pages/group6';

/**
 * Group 6 route path -> page element mapping.
 * Matches GROUP6_ROUTES_CONFIG paths.
 */
const GROUP6_ROUTE_ELEMENTS: Record<string, () => React.ReactElement> = {
  '/facilities-browse': () => <BrowseFacilitiesPage />,
  '/reservations': () => <MyReservationsPage />,
  '/reservations/new': () => <BookResourcePage />,
  '/reservations/approvals': () => <ApprovalQueuePage />,
  '/facilities/manage': () => <ManageFacilitiesPage />,
};

export function renderGroup6Page(path: string): React.ReactElement | null {
  const render = GROUP6_ROUTE_ELEMENTS[path];
  return render ? render() : null;
}
