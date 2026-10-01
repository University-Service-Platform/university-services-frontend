import { apiFetch, unwrapData, unwrapList, type ApiResponse } from '@/services/apiClient';
import type { Facility, CreateFacilityRequest, UpdateFacilityRequest } from '@/types/group6';

/**
 * Facility Service - Group 6
 * Communicates with the Facility & Resource Service through the API Gateway
 */
export const facilityService = {
  /**
   * Fetch all facilities
   */
  async getFacilities(): Promise<{ data: Facility[]; error?: string }> {
    const res = await apiFetch<unknown>('/facilities');
    if (res.error) {
      return { data: [], error: res.error };
    }
    const list = unwrapList(res.data) ?? (Array.isArray(res.data) ? res.data : []);
    return { data: list as unknown as Facility[] };
  },

  /**
   * Fetch a single facility by ID
   */
  async getFacilityById(id: number): Promise<{ data?: Facility; error?: string }> {
    const res = await apiFetch<unknown>(`/facilities/${id}`);
    if (res.error) {
      return { error: res.error };
    }
    const facility = unwrapData<Facility>(res.data);
    return { data: facility };
  },

  /**
   * Create a new facility
   */
  async createFacility(payload: CreateFacilityRequest): Promise<ApiResponse<Facility>> {
    return apiFetch<Facility>('/facilities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update an existing facility
   */
  async updateFacility(id: number, payload: UpdateFacilityRequest): Promise<ApiResponse<Facility>> {
    return apiFetch<Facility>(`/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Toggle or update facility status (active/inactive)
   */
  async toggleStatus(id: number): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(`/facilities/${id}/status`, {
      method: 'PATCH',
    });
  },

  /**
   * Delete a facility
   */
  async deleteFacility(id: number): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(`/facilities/${id}`, {
      method: 'DELETE',
    });
  },
};
