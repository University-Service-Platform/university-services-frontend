import type { UserRole } from '@/types';
import type { RouteNavigationConfig } from './navigationConfig';

/**
 * Group 6 - Facilities & Reservations route configuration
 * Aligned with the shared frontend navigation and role authorization
 */

export const G6_MANAGER_ROLES: UserRole[] = ['RESOURCE_MANAGER', 'ADMIN'];
export const G6_APPROVAL_ROLES: UserRole[] = ['RESOURCE_MANAGER', 'ADMIN'];

export const GROUP6_ROUTES_CONFIG: RouteNavigationConfig[] = [
  {
    id: 'g6-facilities-browse',
    path: '/facilities-browse',
    label: 'Browse Facilities',
    iconName: 'Building2',
    showInNav: true,
  },
  {
    id: 'g6-reservations-my',
    path: '/reservations',
    label: 'My Reservations',
    iconName: 'CalendarCheck',
    showInNav: true,
  },
  {
    id: 'g6-reservation-new',
    path: '/reservations/new',
    label: 'Book Resource',
    iconName: 'CalendarPlus',
    showInNav: false,
  },
  {
    id: 'g6-reservations-approvals',
    path: '/reservations/approvals',
    label: 'Approvals Queue',
    iconName: 'ClipboardCheck',
    requiredRoles: G6_APPROVAL_ROLES,
    showInNav: true,
  },
  {
    id: 'g6-facilities-manage',
    path: '/facilities/manage',
    label: 'Manage Facilities',
    iconName: 'Settings',
    requiredRoles: G6_MANAGER_ROLES,
    showInNav: true,
  },
];
