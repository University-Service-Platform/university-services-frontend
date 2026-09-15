/**
 * Core Types for University Services Management Platform Foundation
 */

export type UserRole = 'ADMIN' | 'STAFF' | 'STUDENT' | 'DEAN' | 'HOD' | 'GUEST';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';

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

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND DTO CONTRACT:
 * The official backend Faculty DTO schema is not yet documented in the repository.
 * The fields below represent an unconfirmed placeholder UI/service boundary subject to change upon official contract.
 */
export interface Faculty {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND DTO CONTRACT:
 * The official backend Service Unit DTO schema is not yet documented in the repository.
 * The fields below represent an unconfirmed placeholder UI/service boundary subject to change upon official contract.
 */
export interface ServiceUnit {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
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
