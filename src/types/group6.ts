/**
 * Group 6: Facilities, Resources & Reservations Types
 * Aligned with the live backend DTO contracts through the API Gateway
 */

export interface Facility {
  id: number;
  code: string;
  name: string;
  location: string;
  description?: string;
  operatingHoursStart: string; // e.g. "08:00:00"
  operatingHoursEnd: string;   // e.g. "22:00:00"
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFacilityRequest {
  code: string;
  name: string;
  location: string;
  description?: string;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  active?: boolean;
}

export interface UpdateFacilityRequest {
  code?: string;
  name?: string;
  location?: string;
  description?: string;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  active?: boolean;
}

export type ResourceType = 'LAB' | 'HALL' | 'ROOM' | 'EQUIPMENT' | 'SPORTS' | string;

export interface Resource {
  id: number;
  facilityId: number;
  facilityName?: string;
  code: string;
  name: string;
  resourceType: ResourceType;
  location: string;
  capacity: number;
  active: boolean;
  available: boolean;
  approvalRequired: boolean;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  rulesDescription?: string;
  allowedUserRoles?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateResourceRequest {
  facilityId: number;
  code: string;
  name: string;
  resourceType: string;
  location: string;
  capacity: number;
  active?: boolean;
  available?: boolean;
  approvalRequired?: boolean;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  rulesDescription?: string;
}

export interface UpdateResourceRequest {
  facilityId?: number;
  code?: string;
  name?: string;
  resourceType?: string;
  location?: string;
  capacity?: number;
  active?: boolean;
  available?: boolean;
  approvalRequired?: boolean;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  rulesDescription?: string;
}

export interface CheckAvailabilityRequest {
  resourceId: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm or HH:mm:ss
  endTime: string; // HH:mm or HH:mm:ss
  requestedCapacity?: number;
  userRole?: string;
}

export interface CheckAvailabilityResponse {
  available: boolean;
  resourceId?: number;
  message?: string;
  conflictReason?: string;
}

export type ReservationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Reservation {
  id: number;
  resourceId: number;
  resourceName?: string;
  facilityName?: string;
  requesterId: string;
  requesterName?: string;
  startTime: string; // ISO string e.g. "2026-10-05T09:00:00"
  endTime: string;   // ISO string e.g. "2026-10-05T11:00:00"
  status: ReservationStatus;
  purpose: string;
  expectedAttendees: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReservationRequest {
  resourceId: number;
  startTime: string; // ISO string e.g. "2026-10-05T09:00:00"
  endTime: string;   // ISO string e.g. "2026-10-05T11:00:00"
  purpose: string;
  expectedAttendees: number;
}

export interface RejectReservationRequest {
  reason: string;
}
