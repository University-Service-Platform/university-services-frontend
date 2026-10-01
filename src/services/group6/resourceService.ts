import { apiFetch, unwrapData, unwrapList, type ApiResponse } from '@/services/apiClient';
import type {
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
  CheckAvailabilityRequest,
  CheckAvailabilityResponse,
} from '@/types/group6';

/**
 * Resource Service - Group 6
 * Communicates with the Facility & Resource Service through the API Gateway
 */
export const resourceService = {
  /**
   * Fetch all resources
   */
  async getResources(): Promise<{ data: Resource[]; error?: string }> {
    const res = await apiFetch<unknown>('/resources');
    if (res.error) {
      return { data: [], error: res.error };
    }
    const list = unwrapList(res.data) ?? (Array.isArray(res.data) ? res.data : []);
    return { data: list as unknown as Resource[] };
  },

  /**
   * Fetch a single resource by ID
   */
  async getResourceById(id: number): Promise<{ data?: Resource; error?: string }> {
    const res = await apiFetch<unknown>(`/resources/${id}`);
    if (res.error) {
      return { error: res.error };
    }
    const resource = unwrapData<Resource>(res.data);
    return { data: resource };
  },

  /**
   * Fetch resources by facility ID
   */
  async getResourcesByFacility(facilityId: number): Promise<{ data: Resource[]; error?: string }> {
    const res = await apiFetch<unknown>(`/resources/facility/${facilityId}`);
    if (res.error) {
      return { data: [], error: res.error };
    }
    const list = unwrapList(res.data) ?? (Array.isArray(res.data) ? res.data : []);
    return { data: list as unknown as Resource[] };
  },

  /**
   * Fetch available resource types
   */
  async getResourceTypes(): Promise<{ data: string[]; error?: string }> {
    const res = await apiFetch<unknown>('/resources/types');
    if (res.error) {
      return { data: ['LAB', 'HALL', 'ROOM', 'EQUIPMENT', 'SPORTS'], error: res.error };
    }
    const list = unwrapList(res.data) ?? (Array.isArray(res.data) ? res.data : []);
    return { data: list as unknown as string[] };
  },

  /**
   * Check availability for a resource given date, time range, capacity, role
   */
  async checkAvailability(payload: CheckAvailabilityRequest): Promise<{ data?: CheckAvailabilityResponse; error?: string }> {
    const res = await apiFetch<unknown>('/resources/check-availability', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.error) {
      return { error: res.error };
    }
    const data = unwrapData<CheckAvailabilityResponse>(res.data);
    return { data };
  },

  /**
   * Create a new resource
   */
  async createResource(payload: CreateResourceRequest): Promise<ApiResponse<Resource>> {
    return apiFetch<Resource>('/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update an existing resource
   */
  async updateResource(id: number, payload: UpdateResourceRequest): Promise<ApiResponse<Resource>> {
    return apiFetch<Resource>(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Toggle resource active status
   */
  async toggleStatus(id: number): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(`/resources/${id}/status`, {
      method: 'PATCH',
    });
  },

  /**
   * Toggle resource availability
   */
  async toggleAvailability(id: number): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(`/resources/${id}/availability`, {
      method: 'PATCH',
    });
  },

  /**
   * Toggle resource approval requirement
   */
  async toggleApprovalRequirement(id: number): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(`/resources/${id}/approval-requirement`, {
      method: 'PATCH',
    });
  },

  /**
   * Delete a resource
   */
  async deleteResource(id: number): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(`/resources/${id}`, {
      method: 'DELETE',
    });
  },
};
