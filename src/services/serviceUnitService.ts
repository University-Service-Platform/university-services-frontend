import { apiFetch, unwrapData, unwrapList } from './apiClient';
import { mapServiceUnit } from './directoryMappers';
import type { ServiceUnit } from '@/types';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Service Unit DTO payloads are not yet documented in the repository.
 * The payload structures below represent an unconfirmed integration boundary subject to change.
 */
export interface ServiceUnitCreatePayload {
  name: string;
  code: string;
  description?: string;
}

export interface ServiceUnitUpdatePayload {
  name?: string;
  code?: string;
  description?: string;
}

export interface ServiceUnitServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend API contract for Service Unit management endpoints is not yet documented in the repository.
 * The endpoint constant below serves as a placeholder integration boundary that will be updated
 * once the official backend OpenAPI/Swagger specification is provided by the backend team.
 */
export const SERVICE_UNITS_API_ENDPOINT = import.meta.env.VITE_SERVICE_UNITS_API_ENDPOINT || '/service-units';

export async function getServiceUnits(): Promise<ServiceUnitServiceResult<ServiceUnit[]>> {
  const response = await apiFetch<ServiceUnit[]>(SERVICE_UNITS_API_ENDPOINT, {
    method: 'GET',
  });

  const list = unwrapList(response.data);
  if (response.error || !list) {
    return {
      success: false,
      message: response.error || 'Unable to load service units right now. Please try again in a moment.',
    };
  }

  return {
    success: true,
    data: list.map(mapServiceUnit),
  };
}

export async function createServiceUnit(payload: ServiceUnitCreatePayload): Promise<ServiceUnitServiceResult<ServiceUnit>> {
  const response = await apiFetch<ServiceUnit>(SERVICE_UNITS_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to create service unit. Unable to connect to backend service unit service.',
    };
  }

  return {
    success: true,
    data: mapServiceUnit(unwrapData<Record<string, unknown>>(response.data) ?? {}),
    message: 'Service unit created successfully.',
  };
}

export async function updateServiceUnit(id: string, payload: ServiceUnitUpdatePayload): Promise<ServiceUnitServiceResult<ServiceUnit>> {
  const response = await apiFetch<ServiceUnit>(`${SERVICE_UNITS_API_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to update service unit. Unable to connect to backend service unit service.',
    };
  }

  return {
    success: true,
    data: mapServiceUnit(unwrapData<Record<string, unknown>>(response.data) ?? {}),
    message: 'Service unit updated successfully.',
  };
}

export async function deleteServiceUnit(id: string): Promise<ServiceUnitServiceResult<null>> {
  const response = await apiFetch<null>(`${SERVICE_UNITS_API_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (response.error) {
    return {
      success: false,
      message: response.error || 'Failed to delete service unit. Unable to connect to backend service unit service.',
    };
  }

  return {
    success: true,
    message: 'Service unit deleted successfully.',
  };
}
