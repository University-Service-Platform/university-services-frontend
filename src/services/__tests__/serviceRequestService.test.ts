import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  triageServiceRequest,
  rejectServiceRequest,
  escalateServiceRequest,
  getServiceRequestSummary,
} from '../serviceRequestService';

vi.mock('../apiClient', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../apiClient';

describe('serviceRequestService Group 7 API Calls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triageServiceRequest sends PATCH to /api/service-requests/{id}/triage with correct payload', async () => {
    const mockResponse = {
      status: 200,
      data: {
        requestId: 'REQ-101',
        category: 'IT',
        priority: 'HIGH',
        responsibleServiceUnit: 'IT Helpdesk',
        status: 'ASSIGNED',
      },
    };
    (apiFetch as any).mockResolvedValue(mockResponse);

    const result = await triageServiceRequest('REQ-101', {
      category: 'IT',
      priority: 'HIGH',
      responsibleServiceUnit: 'IT Helpdesk',
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/service-requests/REQ-101/triage', {
      method: 'PATCH',
      body: JSON.stringify({
        category: 'IT',
        priority: 'HIGH',
        responsibleServiceUnit: 'IT Helpdesk',
      }),
    });
    expect(result.success).toBe(true);
    expect(result.data?.requestId).toBe('REQ-101');
  });

  it('rejectServiceRequest sends PATCH to /api/service-requests/{id}/reject with rejectionReason', async () => {
    const mockResponse = {
      status: 200,
      data: {
        requestId: 'REQ-102',
        status: 'REJECTED',
        rejectionReason: 'Invalid location provided',
      },
    };
    (apiFetch as any).mockResolvedValue(mockResponse);

    const result = await rejectServiceRequest('REQ-102', {
      rejectionReason: 'Invalid location provided',
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/service-requests/REQ-102/reject', {
      method: 'PATCH',
      body: JSON.stringify({
        rejectionReason: 'Invalid location provided',
      }),
    });
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('REJECTED');
  });

  it('escalateServiceRequest sends PATCH to /api/service-requests/{id}/escalate with responsibleServiceUnit', async () => {
    const mockResponse = {
      status: 200,
      data: {
        requestId: 'REQ-103',
        status: 'ESCALATED',
        responsibleServiceUnit: 'Executive IT Support',
      },
    };
    (apiFetch as any).mockResolvedValue(mockResponse);

    const result = await escalateServiceRequest('REQ-103', {
      responsibleServiceUnit: 'Executive IT Support',
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/service-requests/REQ-103/escalate', {
      method: 'PATCH',
      body: JSON.stringify({
        responsibleServiceUnit: 'Executive IT Support',
      }),
    });
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('ESCALATED');
  });

  it('getServiceRequestSummary sends GET to /api/service-requests/summary?groupBy={dimension}', async () => {
    const mockResponse = {
      status: 200,
      data: {
        NEW: 5,
        IN_PROGRESS: 12,
        RESOLVED: 8,
      },
    };
    (apiFetch as any).mockResolvedValue(mockResponse);

    const result = await getServiceRequestSummary('status');

    expect(apiFetch).toHaveBeenCalledWith('/api/service-requests/summary?groupBy=status', {
      method: 'GET',
    });
    expect(result.success).toBe(true);
    expect(result.data?.NEW).toBe(5);
  });
});
