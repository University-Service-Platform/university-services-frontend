import type { UniversityEvent, UserRole } from '@/types';
import { formatDateTime } from './format';

/**
 * Explains, in user language, why registration is or is not possible
 * (BA key business rule 1.4). This is a UX pre-check only - the backend
 * re-checks status, window, eligibility and capacity on every request.
 */
export interface RegistrationAvailability {
  open: boolean;
  reason: string;
}

export function getRegistrationAvailability(event: UniversityEvent, now = Date.now()): RegistrationAvailability {
  if (event.status === 'CANCELLED') {
    return { open: false, reason: 'This event has been cancelled - registration is closed.' };
  }
  if (event.status === 'COMPLETED') {
    return { open: false, reason: 'This event has already taken place.' };
  }
  if (event.status === 'DRAFT') {
    return { open: false, reason: 'This event is a draft and is not open for registration yet.' };
  }
  if (now < new Date(event.registrationOpensAt).getTime()) {
    return { open: false, reason: `Registration opens on ${formatDateTime(event.registrationOpensAt)}.` };
  }
  if (now > new Date(event.registrationClosesAt).getTime()) {
    return { open: false, reason: `Registration closed on ${formatDateTime(event.registrationClosesAt)}.` };
  }
  if (event.confirmedCount >= event.capacity) {
    return { open: false, reason: 'Capacity reached - registration is closed.' };
  }
  return { open: true, reason: `Registration open until ${formatDateTime(event.registrationClosesAt)}.` };
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  STAFF: 'Staff',
  STUDENT: 'Student',
  DEAN: 'Dean',
  HOD: 'Head of Department',
  GUEST: 'Guest',
};

export function describeEligibility(event: UniversityEvent): string {
  const { roles, facultyIds, departmentIds } = event.eligibility;
  const parts: string[] = [];
  if (roles.length) parts.push(`Roles: ${roles.map((role) => ROLE_LABELS[role]).join(', ')}`);
  if (facultyIds.length) parts.push(`Faculties: ${facultyIds.join(', ')}`);
  if (departmentIds.length) parts.push(`Departments: ${departmentIds.join(', ')}`);
  return parts.length ? parts.join(' · ') : 'Open to all university members';
}
