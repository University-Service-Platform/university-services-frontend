/**
 * Core Types for University Services Management Platform Foundation
 */

export type UserRole =
  | 'STUDENT'
  | 'ACADEMIC_STAFF'
  | 'ADMIN_STAFF'
  | 'SERVICE_DESK_OFFICER'
  | 'TECHNICIAN'
  | 'SERVICE'
  | 'ADMIN'
  | 'STAFF'
  | 'DEAN'
  | 'HOD'
  | 'GUEST';

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

/**
 * OFFICIAL BACKEND SERVICE REQUEST DTO CONTRACT:
 */
export type RequestCategory =
  | 'FACILITY'
  | 'EQUIPMENT'
  | 'IT'
  | 'GENERAL';

export type RequestPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type RequestStatus =
  | 'NEW'
  | 'ACKNOWLEDGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ESCALATED';

export type ServiceRequestStatus = RequestStatus;

export interface ServiceRequest {
  requestId: string;
  requesterId: string;
  category: RequestCategory;
  location: string;
  priority: RequestPriority;
  description: string;
  attachmentReference?: string | null;
  status: RequestStatus;
  responsibleServiceUnit?: string | null;
  rejectionReason?: string | null;
  confirmationFeedback?: string | null;
  reportedTime: string;
  acknowledgedTime?: string | null;
  assignedTime?: string | null;
  resolvedTime?: string | null;
  closedTime?: string | null;
}

export interface CreateServiceRequestRequest {
  category: RequestCategory;
  location: string;
  priority: RequestPriority;
  description: string;
  attachmentReference?: string | null;
}

export interface ConfirmRequest {
  confirmationFeedback: string;
}

export interface TriageRequestPayload {
  category: RequestCategory;
  priority: RequestPriority;
  responsibleServiceUnit: string;
}

export interface RejectRequestPayload {
  rejectionReason: string;
}

export interface EscalateRequestPayload {
  responsibleServiceUnit: string;
}

export type SummaryGroupByDimension =
  | 'status'
  | 'category'
  | 'priority'
  | 'location'
  | 'responsibleServiceUnit'
  | 'unit';

export type ServiceRequestSummaryResponse = Record<string, number>;

/**
 * OFFICIAL BACKEND WORK ORDER DTO CONTRACT:
 */
export type WorkOrderStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface WorkOrder {
  workOrderId: string;
  requestId: string;
  assignedTechnicianId: string;
  serviceTeam?: string | null;
  schedule?: string | null;
  status: WorkOrderStatus;
  actionNotes?: string | null;
  resolution?: string | null;
  startTime?: string | null;
  resolutionTime?: string | null;
  closureTime?: string | null;
  createdTime: string;
  version?: number;
}

export interface CreateWorkOrderPayload {
  requestId: string;
  assignedTechnicianId: string;
  serviceTeam?: string;
  schedule?: string;
}

export interface AddProgressNotePayload {
  note: string;
}

export interface RecordResolutionPayload {
  resolution: string;
}

export type WorkOrderSummaryGroupByDimension = 'status' | 'technician' | 'serviceTeam';

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


