import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkOrdersPage } from '../WorkOrdersPage';
import * as workOrderService from '@/services/workOrderService';

vi.mock('@/services/workOrderService');

const mockWorkOrders = [
  {
    workOrderId: 'WO-2026-0001',
    requestId: 'REQ-101',
    assignedTechnicianId: 'TECH-001',
    serviceTeam: 'Facilities Team',
    schedule: '2026-09-30',
    status: 'ASSIGNED',
    createdTime: '2026-09-29T10:00:00Z',
  },
];

describe('WorkOrdersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockImplementation(
      () => new Promise(() => {})
    );

    render(<WorkOrdersPage />);
    expect(screen.getByText(/Loading Work Orders/i)).toBeInTheDocument();
  });

  it('loads and displays work orders list', async () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: true,
      data: mockWorkOrders as any,
    });

    render(<WorkOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('WO-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('REQ-101')).toBeInTheDocument();
      expect(screen.getByText('TECH-001')).toBeInTheDocument();
    });
  });

  it('displays empty state when no work orders exist', async () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: true,
      data: [],
    });

    render(<WorkOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/No Work Orders Found/i)).toBeInTheDocument();
    });
  });

  it('displays error state when fetching fails', async () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: false,
      message: 'Failed to fetch work orders: 500 Internal Error',
    });

    render(<WorkOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to Load Work Orders/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch work orders: 500 Internal Error/i)).toBeInTheDocument();
    });
  });
});
