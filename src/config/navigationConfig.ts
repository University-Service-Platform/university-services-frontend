import type { UserRole, NavItem } from '@/types';

export interface RouteNavigationConfig {
  id: string;
  path: string;
  label: string;
  iconName: string;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  showInNav: boolean;
  isPublic?: boolean;
}

/**
 * Group 5 Centralized Route & Navigation Configuration
 * 
 * Single source of truth driving both:
 * 1. Sidebar navigation visibility
 * 2. Route protection authorization rules
 */
export const APP_ROUTES_CONFIG: RouteNavigationConfig[] = [
  {
    id: 'dashboard',
    path: '/',
    label: 'Dashboard',
    iconName: 'LayoutDashboard',
    showInNav: true,
    isPublic: true,
  },
  {
    id: 'profile',
    path: '/profile',
    label: 'Profile',
    iconName: 'User',
    showInNav: true,
  },
  {
    id: 'users',
    path: '/users',
    label: 'Users',
    iconName: 'Users',
    requiredRoles: ['ADMIN', 'STAFF'],
    showInNav: true,
  },
  {
    id: 'account-status',
    path: '/users/account-status',
    label: 'Account Status',
    iconName: 'UserCheck',
    requiredRoles: ['ADMIN', 'STAFF'],
    showInNav: true,
  },

  {
    id: 'roles',
    path: '/roles',
    label: 'Roles',
    iconName: 'Shield',
    requiredRoles: ['ADMIN'],
    showInNav: true,
  },
  {
    id: 'faculties',
    path: '/faculties',
    label: 'Faculties',
    iconName: 'GraduationCap',
    requiredRoles: ['ADMIN'],
    showInNav: true,
  },
  {
    id: 'departments',
    path: '/departments',
    label: 'Departments',
    iconName: 'Building2',
    requiredRoles: ['ADMIN', 'DEAN', 'HOD'],
    showInNav: true,
  },
  {
    id: 'service-units',
    path: '/service-units',
    label: 'Service Units',
    iconName: 'Layers',
    requiredRoles: ['ADMIN', 'STAFF'],
    showInNav: true,
  },
  {
    id: 'my-requests',
    path: '/requests/my',
    label: 'My requests',
    iconName: 'FileText',
    requiredRoles: ['STUDENT', 'ACADEMIC_STAFF', 'ADMIN_STAFF', 'STAFF', 'ADMIN', 'DEAN', 'HOD'],
    showInNav: true,
  },
  {
    id: 'new-request',
    path: '/requests/new',
    label: 'New request',
    iconName: 'PlusCircle',
    requiredRoles: ['STUDENT', 'ACADEMIC_STAFF', 'ADMIN_STAFF', 'STAFF', 'ADMIN', 'DEAN', 'HOD'],
    showInNav: true,
  },
  {
    id: 'triage',
    path: '/triage',
    label: 'Triage Queue',
    iconName: 'Inbox',
    requiredRoles: ['SERVICE_DESK_OFFICER'],
    showInNav: true,
  },
  {
    id: 'service-dashboard',
    path: '/service-dashboard',
    label: 'Service Dashboard',
    iconName: 'BarChart2',
    requiredRoles: ['SERVICE_DESK_OFFICER', 'ADMIN_STAFF'],
    showInNav: true,
  },
  {
    id: 'work-orders',
    path: '/work-orders',
    label: 'Work Orders',
    iconName: 'Wrench',
    requiredRoles: ['SERVICE_DESK_OFFICER', 'TECHNICIAN', 'SERVICE'],
    showInNav: true,
  },
  {
    id: 'assignments',
    path: '/assignments',
    label: 'Assignments',
    iconName: 'UserCheck',
    requiredRoles: ['SERVICE_DESK_OFFICER', 'TECHNICIAN', 'SERVICE'],
    showInNav: true,
  },
  {
    id: 'technician',
    path: '/technician',
    label: 'Technician Workspace',
    iconName: 'Wrench',
    requiredRoles: ['TECHNICIAN'],
    showInNav: true,
  },
];

/**
 * Utility function to filter navigation items based on authorization and account status.
 */
export function getAuthorizedNavItems(
  isAuthorizedFn: (requiredRoles?: UserRole[], requiredPermissions?: string[]) => boolean,
  isAuthenticated: boolean,
  isAccountInactive?: boolean
): NavItem[] {
  if (isAccountInactive) {
    // Inactive users do not receive protected platform service navigation
    return APP_ROUTES_CONFIG.filter((route) => route.isPublic && route.showInNav).map((route) => ({
      label: route.label,
      path: route.path,
      icon: route.iconName,
    }));
  }

  return APP_ROUTES_CONFIG.filter((route) => {
    if (!route.showInNav) return false;
    if (route.isPublic) return true;
    if (!isAuthenticated) return false;
    return isAuthorizedFn(route.requiredRoles, route.requiredPermissions);
  }).map((route) => ({
    label: route.label,
    path: route.path,
    icon: route.iconName,
  }));
}
