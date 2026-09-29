import { apiFetch } from './apiClient';
import type {
  ServiceRequest,
  CreateServiceRequestRequest,
  ConfirmRequest,
  RequestCategory,
  RequestStatus,
} from '@/types';

export interface ServiceRequestServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
}

export type ServiceRequestCreatePayload = CreateServiceRequestRequest;

export const SERVICE_REQUESTS_API_ENDPOINT = '/api/service-requests';

/**
 * GET /api/service-requests
 * Retrieves user's service requests flat array with optional query parameters.
 */
export async function getMyServiceRequests(params?: {
  status?: RequestStatus;
  category?: RequestCategory;
  requesterId?: string;
}): Promise<ServiceRequestServiceResult<ServiceRequest[]>> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.requesterId) queryParams.append('requesterId', params.requesterId);

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${SERVICE_REQUESTS_API_ENDPOINT}?${queryString}`
    : SERVICE_REQUESTS_API_ENDPOINT;

  const response = await apiFetch<ServiceRequest[]>(endpoint, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status,
      message: response.error || 'Failed to fetch service requests.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: Array.isArray(response.data) ? response.data : [],
  };
}

/**
 * GET /api/service-requests/{id}
 * Retrieves full details for a single service request.
 */
export async function getServiceRequestById(
  id: string
): Promise<ServiceRequestServiceResult<ServiceRequest>> {
  const endpoint = `${SERVICE_REQUESTS_API_ENDPOINT}/${encodeURIComponent(id)}`;

  const response = await apiFetch<ServiceRequest>(endpoint, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    let msg = response.error;
    if (response.status === 404) {
      msg = `Service request '${id}' was not found.`;
    } else if (response.status === 403) {
      msg = `You are not authorized to view request '${id}'.`;
    } else if (response.status === 401) {
      msg = 'Authentication required. Please log in again.';
    }

    return {
      success: false,
      status: response.status,
      message: msg || 'Unable to load service request details.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
  };
}

/**
 * POST /api/service-requests
 * Submits a new service request.
 */
export async function createServiceRequest(
  payload: CreateServiceRequestRequest
): Promise<ServiceRequestServiceResult<ServiceRequest>> {
  const response = await apiFetch<ServiceRequest>(SERVICE_REQUESTS_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      category: payload.category,
      location: payload.location,
      priority: payload.priority,
      description: payload.description,
      attachmentReference: payload.attachmentReference || null,
    }),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status,
      message: response.error || 'Failed to create service request.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
    message: `Service request ${response.data.requestId} created successfully.`,
  };
}

/**
 * PATCH /api/service-requests/{id}/confirm
 * Requester confirms & closes a resolved service request.
 */
export async function confirmAndCloseServiceRequest(
  id: string,
  payload: ConfirmRequest
): Promise<ServiceRequestServiceResult<ServiceRequest>> {
  const endpoint = `${SERVICE_REQUESTS_API_ENDPOINT}/${encodeURIComponent(id)}/confirm`;

  const response = await apiFetch<ServiceRequest>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify({
      confirmationFeedback: payload.confirmationFeedback,
    }),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      status: response.status,
      message: response.error || 'Failed to confirm and close service request.',
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data,
    message: `Service request ${response.data.requestId} confirmed and closed successfully.`,
  };
}
