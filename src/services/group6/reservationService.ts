import { apiFetch, unwrapData, unwrapList, type ApiResponse } from '@/services/apiClient';
import type {
  Reservation,
  CreateReservationRequest,
  RejectReservationRequest,
} from '@/types/group6';

/**
 * Reservation Service - Group 6
 * Communicates with the University Reservation Service through the API Gateway
 */
export const reservationService = {
  /**
   * Fetch current user's reservations
   */
  async getMyReservations(): Promise<{ data: Reservation[]; error?: string }> {
    const res = await apiFetch<unknown>('/reservations/my');
    if (res.error) {
      return { data: [], error: res.error };
    }
    const list = unwrapList(res.data) ?? (Array.isArray(res.data) ? res.data : []);
    return { data: list as unknown as Reservation[] };
  },

  /**
   * Fetch pending reservations awaiting approval (RESOURCE_MANAGER only)
   */
  async getPendingReservations(): Promise<{ data: Reservation[]; error?: string }> {
    const res = await apiFetch<unknown>('/reservations/pending');
    if (res.error) {
      return { data: [], error: res.error };
    }
    const list = unwrapList(res.data) ?? (Array.isArray(res.data) ? res.data : []);
    return { data: list as unknown as Reservation[] };
  },

  /**
   * Fetch a reservation by ID
   */
  async getReservationById(id: number): Promise<{ data?: Reservation; error?: string }> {
    const res = await apiFetch<unknown>(`/reservations/${id}`);
    if (res.error) {
      return { error: res.error };
    }
    const reservation = unwrapData<Reservation>(res.data);
    return { data: reservation };
  },

  /**
   * Fetch reservation history (audit / approval logs)
   */
  async getReservationHistory(id: number): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(`/reservations/${id}/history`);
  },

  /**
   * Create a new reservation
   */
  async createReservation(payload: CreateReservationRequest): Promise<ApiResponse<Reservation>> {
    return apiFetch<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Cancel an existing reservation (by owner)
   */
  async cancelReservation(id: number): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(`/reservations/${id}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * Approve a pending reservation (RESOURCE_MANAGER only)
   */
  async approveReservation(id: number): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(`/reservations/${id}/approve`, {
      method: 'POST',
    });
  },

  /**
   * Reject a pending reservation with a reason (RESOURCE_MANAGER only)
   */
  async rejectReservation(id: number, payload: RejectReservationRequest): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>(`/reservations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
