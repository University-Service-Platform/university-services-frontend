import { apiFetch } from './apiClient';
import type {
  WorkOrder,
  WorkOrderStatus,
  CreateWorkOrderPayload,
  AddProgressNotePayload,
  RecordResolutionPayload,
  WorkOrderSummaryGroupByDimension,
} from '@/types';

export interface WorkOrderServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
}

export const WORK_ORDERS_API_ENDPOINT = '/api/work-orders';

/**
 * POST /api/work-orders
 * Role: SERVICE_DESK_OFFICER
 * Creates a work order from an ACKNOWLEDGED or ESCALATED service request.
 * Upstream status update is handled by the backend.
 */
export async function createWorkOrder(
  payload: CreateWorkOrderPayload
): Promise<WorkOrderServiceResult<WorkOrder>> {
  const response = await apiFetch<WorkOrder>(WORK_ORDERS_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      requestId: payload.requestId,
      assignedTechnicianId: payload.assignedTechnicianId,
      serviceTeam: payload.serviceTeam || null,
      schedule: payload.schedule || null,
    }),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status,
      message: response.error || 'Failed to create work order.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
    message: `Work Order ${response.data.workOrderId} created successfully.`,
  };
}

/**
 * GET /api/work-orders
 * Allowed roles: TECHNICIAN, SERVICE_DESK_OFFICER, SERVICE
 * Optional query parameters: technicianId, status
 * Returns raw JSON array: [ { "workOrderId": "WO-2026-0001" } ]
 */
export async function getWorkOrders(params?: {
  technicianId?: string;
  status?: WorkOrderStatus;
}): Promise<WorkOrderServiceResult<WorkOrder[]>> {
  const queryParams = new URLSearchParams();
  if (params?.technicianId) queryParams.append('technicianId', params.technicianId);
  if (params?.status) queryParams.append('status', params.status);

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${WORK_ORDERS_API_ENDPOINT}?${queryString}`
    : WORK_ORDERS_API_ENDPOINT;

  const response = await apiFetch<WorkOrder[]>(endpoint, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status,
      message: response.error || 'Failed to fetch work orders.',
    };
  }

  const dataArray = Array.isArray(response.data) ? response.data : [];

  return {
    success: true,
    status: response.status,
    data: dataArray,
  };
}

/**
 * GET /api/work-orders/{id}
 * Role: Assigned technician, service desk, or service
 * Accepts string ID (e.g. WO-2026-0001).
 */
export async function getWorkOrderById(
  id: string
): Promise<WorkOrderServiceResult<WorkOrder>> {
  const endpoint = `${WORK_ORDERS_API_ENDPOINT}/${encodeURIComponent(id)}`;

  const response = await apiFetch<WorkOrder>(endpoint, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    let msg = response.error;
    if (response.status === 404) {
      msg = `Work order '${id}' was not found.`;
    } else if (response.status === 403) {
      msg = `You are not authorized to view work order '${id}'.`;
    }

    return {
      success: false,
      status: response.status,
      message: msg || `Failed to fetch work order details.`,
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
  };
}

/**
 * PATCH /api/work-orders/{id}/start
 * Role: TECHNICIAN
 * Starts work on assigned work order (ASSIGNED -> IN_PROGRESS).
 */
export async function startWorkOrder(
  id: string
): Promise<WorkOrderServiceResult<WorkOrder>> {
  const endpoint = `${WORK_ORDERS_API_ENDPOINT}/${encodeURIComponent(id)}/start`;

  const response = await apiFetch<WorkOrder>(endpoint, {
    method: 'PATCH',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status,
      message: response.error || 'Failed to start work on work order.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
    message: `Started work on Work Order ${id}.`,
  };
}

/**
 * PATCH /api/work-orders/{id}/progress
 * Role: TECHNICIAN
 * Body: { note: string }
 * Appends action note to work order while IN_PROGRESS.
 */
export async function addWorkOrderProgressNote(
  id: string,
  payload: AddProgressNotePayload
): Promise<WorkOrderServiceResult<WorkOrder>> {
  const endpoint = `${WORK_ORDERS_API_ENDPOINT}/${encodeURIComponent(id)}/progress`;

  const response = await apiFetch<WorkOrder>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify({
      note: payload.note,
    }),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status,
      message: response.error || 'Failed to add progress note.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
    message: `Progress note added to Work Order ${id}.`,
  };
}

/**
 * PATCH /api/work-orders/{id}/resolution
 * Role: TECHNICIAN
 * Body: { resolution: string }
 * Records resolution (ASSIGNED / IN_PROGRESS -> RESOLVED).
 */
export async function recordWorkOrderResolution(
  id: string,
  payload: RecordResolutionPayload
): Promise<WorkOrderServiceResult<WorkOrder>> {
  const endpoint = `${WORK_ORDERS_API_ENDPOINT}/${encodeURIComponent(id)}/resolution`;

  const response = await apiFetch<WorkOrder>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify({
      resolution: payload.resolution,
    }),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status,
      message: response.error || 'Failed to record resolution.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
    message: `Resolution recorded for Work Order ${id}.`,
  };
}

/**
 * GET /api/work-orders/summary?groupBy={status|technician|serviceTeam}
 * Role: SERVICE_DESK_OFFICER, ADMIN_STAFF
 */
export async function getWorkOrderSummary(
  groupBy: WorkOrderSummaryGroupByDimension = 'status'
): Promise<WorkOrderServiceResult<Record<string, number>>> {
  const endpoint = `${WORK_ORDERS_API_ENDPOINT}/summary?groupBy=${encodeURIComponent(groupBy)}`;

  const response = await apiFetch<Record<string, number> | { counts?: Record<string, number> }>(endpoint, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status,
      message: response.error || 'Failed to fetch work order summary.',
    };
  }

  let counts: Record<string, number> = {};
  if (typeof response.data === 'object' && response.data !== null) {
    if ('counts' in response.data && typeof response.data.counts === 'object' && response.data.counts !== null) {
      counts = response.data.counts as Record<string, number>;
    } else {
      counts = response.data as Record<string, number>;
    }
  }

  return {
    success: true,
    status: response.status,
    data: counts,
  };
}
