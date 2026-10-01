import { afterEach, describe, expect, it, vi } from 'vitest';
import { facilityService } from '../group6/facilityService';
import { resourceService } from '../group6/resourceService';
import { reservationService } from '../group6/reservationService';
import { jsonResponse, mockFetch } from './testUtils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Group 6: Facility, Resource, and Reservation Services', () => {
  it('loads facilities from GET /facilities unwrapping the envelope', async () => {
    mockFetch(
      jsonResponse(200, {
        success: true,
        data: [
          {
            id: 1,
            code: 'ENG-BLDG-A',
            name: 'Engineering Complex - Block A',
            location: 'North Campus, Sector 4',
            operatingHoursStart: '08:00:00',
            operatingHoursEnd: '22:00:00',
            active: true,
          },
        ],
      })
    );

    const result = await facilityService.getFacilities();
    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].code).toBe('ENG-BLDG-A');
    expect(result.data[0].name).toBe('Engineering Complex - Block A');
  });

  it('loads resources by facility from GET /resources/facility/{facilityId}', async () => {
    mockFetch(
      jsonResponse(200, {
        success: true,
        data: [
          {
            id: 10,
            facilityId: 1,
            code: 'LAB-101',
            name: 'HPC Lab',
            resourceType: 'LAB',
            location: 'Room A-101',
            capacity: 30,
            active: true,
            available: true,
            approvalRequired: true,
          },
        ],
      })
    );

    const result = await resourceService.getResourcesByFacility(1);
    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].resourceType).toBe('LAB');
    expect(result.data[0].capacity).toBe(30);
  });

  it('checks resource availability via POST /resources/check-availability', async () => {
    mockFetch(
      jsonResponse(200, {
        success: true,
        data: {
          available: true,
          resourceId: 10,
        },
      })
    );

    const res = await resourceService.checkAvailability({
      resourceId: 10,
      date: '2026-10-05',
      startTime: '09:00',
      endTime: '11:00',
      requestedCapacity: 5,
    });

    expect(res.error).toBeUndefined();
    expect(res.data).toEqual({ available: true, resourceId: 10 });
  });

  it('loads my reservations from GET /reservations/my', async () => {
    mockFetch(
      jsonResponse(200, {
        success: true,
        data: [
          {
            id: 7,
            resourceId: 10,
            requesterId: 'usr-student-001',
            startTime: '2026-10-05T09:00:00',
            endTime: '2026-10-05T11:00:00',
            status: 'PENDING',
            purpose: 'Group project meeting',
            expectedAttendees: 5,
          },
        ],
      })
    );

    const result = await reservationService.getMyReservations();
    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe('PENDING');
    expect(result.data[0].expectedAttendees).toBe(5);
  });

  it('handles cancellation and approvals correctly', async () => {
    mockFetch(
      jsonResponse(200, { success: true, message: 'Reservation cancelled' }),
      jsonResponse(200, { success: true, message: 'Reservation approved' }),
      jsonResponse(200, { success: true, message: 'Reservation rejected' })
    );

    const cancelRes = await reservationService.cancelReservation(7);
    expect(cancelRes.error).toBeUndefined();

    const approveRes = await reservationService.approveReservation(7);
    expect(approveRes.error).toBeUndefined();

    const rejectRes = await reservationService.rejectReservation(7, { reason: 'Capacity exceeded' });
    expect(rejectRes.error).toBeUndefined();
  });
});
