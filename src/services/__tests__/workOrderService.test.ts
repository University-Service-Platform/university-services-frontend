import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createWorkOrder,
  getWorkOrders,
  getWorkOrderById,
  startWorkOrder,
  addWorkOrderProgressNote,
  recordWorkOrderResolution,
  getWorkOrderSummary,
} from '../workOrderService';

vi.mock('../apiClient', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../apiClient';

describe('workOrderService Group 7 API Calls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createWorkOrder sends POST to /api/work-orders with payload', async () => {
    const mockResponse = {
      status: 201,
      data: {
        workOrderId: 'WO-2026-0001',
        requestId: 'REQ-101',
        assignedTechnicianId: 'TECH-001',
        serviceTeam: 'Electrical',
        schedule: '2026-09-30 09:00',
        status: 'ASSIGNED',
        createdTime: '2026-09-29T10:00:00Z',
      },
    };
    (apiFetch as any).mockResolvedValue(mockResponse);

    const result = await createWorkOrder({
      requestId: 'REQ-101',
      assignedTechnicianId: 'TECH-001',
      serviceTeam: 'Electrical',
      schedule: '2026-09-30 09:00',
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/work-orders', {
      method: 'POST',
      body: JSON.stringify({
        requestId: 'REQ-101',
        assignedTechnicianId: 'TECH-001',
        serviceTeam: 'Electrical',
        schedule: '2026-09-30 09:00',
      }),
    });
    expect(result.success).toBe(true);
    expect(result.data?.workOrderId).toBe('WO-2026-0001');
  });

  it('getWorkOrders sends GET to /api/work-orders with optional technicianId filter', async () => {
    const mockResponse = {
      status: 200,
      data: [
        {
          workOrderId: 'WO-2026-0001',
          requestId: 'REQ-101',
          assignedTechnicianId: 'TECH-001',
          status: 'ASSIGNED',
          createdTime: '2026-09-29T10:00:00Z',
        },
      ],
    };
    (apiFetch as any).mockResolvedValue(mockResponse);

    const result = await getWorkOrders({ technicianId: 'TECH-001' });

    expect(apiFetch).toHaveBeenCalledWith('/api/work-orders?technicianId=TECH-001', {
      method: 'GET',
    });
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].workOrderId).toBe('WO-2026-0001');
  });

  it('getWorkOrderById sends GET to /api/work-orders/{id}', async () => {
    const mockResponse = {
      status: 200,
      data: {
        workOrderId: 'WO-2026-0002',
        requestId: 'REQ-102',
        assignedTechnicianId: 'TECH-002',
        status: 'IN_PROGRESS',
        createdTime: '2026-09-29T11:00:00Z',
      },
    };
    (apiFetch as any).mockResolvedValue(mockResponse);

    const result = await getWorkOrderById('WO-2026-0002');

    expect(apiFetch).toHaveBeenCalledWith('/api/work-orders/WO-2026-0002', {
      method: 'GET',
    });
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('IN_PROGRESS');
  });

  it('startWorkOrder sends PATCH to /api/work-orders/{id}/start', async () => {
    const mockResponse = {
      status: 200,
      data: {
        workOrderId: 'WO-2026-0001',
        status: 'IN_PROGRESS',
      },
    };
    (apiFetch as any).mockResolvedValue(mockResponse);

    const result = await startWorkOrder('WO-2026-0001');

    expect(apiFetch).toHaveBeenCalledWith('/api/work-orders/WO-2026-0001/start', {
      method: 'PATCH',
    });
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('IN_PROGRESS');
  });

  it('addWorkOrderProgressNote sends PATCH to /api/work-orders/{id}/progress with note body', async () => {
    const mockResponse = {
      status: 200,
      data: {
        workOrderId: 'WO-2026-0001',
        status: 'IN_PROGRESS',
        actionNotes: 'Replaced faulty capacitor',
      },
    };
    (apiFetch as any).mockResolvedValue(mockResponse);

    const result = await addWorkOrderProgressNote('WO-2026-0001', {
      note: 'Replaced faulty capacitor',
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/work-orders/WO-2026-0001/progress', {
      method: 'PATCH',
      body: JSON.stringify({ note: 'Replaced faulty capacitor' }),
    });
    expect(result.success).toBe(true);
    expect(result.data?.actionNotes).toBe('Replaced faulty capacitor');
  });

  it('recordWorkOrderResolution sends PATCH to /api/work-orders/{id}/resolution with resolution body', async () => {
    const mockResponse = {
      status: 200,
      data: {
        workOrderId: 'WO-2026-0001',
        status: 'RESOLVED',
        resolution: 'Verified equipment operation and restored power',
      },
    };
    (apiFetch as any).mockResolvedValue(mockResponse);

    const result = await recordWorkOrderResolution('WO-2026-0001', {
      resolution: 'Verified equipment operation and restored power',
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/work-orders/WO-2026-0001/resolution', {
      method: 'PATCH',
      body: JSON.stringify({ resolution: 'Verified equipment operation and restored power' }),
    });
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('RESOLVED');
  });

  it('getWorkOrderSummary sends GET to /api/work-orders/summary?groupBy={dimension}', async () => {
    const mockResponse = {
      status: 200,
      data: {
        ASSIGNED: 4,
        IN_PROGRESS: 6,
        RESOLVED: 10,
      },
    };
    (apiFetch as any).mockResolvedValue(mockResponse);

    const result = await getWorkOrderSummary('status');

    expect(apiFetch).toHaveBeenCalledWith('/api/work-orders/summary?groupBy=status', {
      method: 'GET',
    });
    expect(result.success).toBe(true);
    expect(result.data?.ASSIGNED).toBe(4);
  });
});
