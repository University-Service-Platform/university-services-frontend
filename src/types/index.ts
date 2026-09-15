/**
 * Core Types for University Services Management Platform Foundation
 */

export type UserRole = 'ADMIN' | 'STAFF' | 'STUDENT' | 'DEAN' | 'HOD' | 'GUEST';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  facultyId?: string;
  departmentId?: string;
  serviceUnitId?: string;
  facultyName?: string;
  departmentName?: string;
  serviceUnitName?: string;
  accountStatus?: AccountStatus;
  phone?: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  requiredRole?: UserRole[];
  badge?: string | number;
}

export type VariantType = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger';
export type SizeType = 'sm' | 'md' | 'lg';
export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
