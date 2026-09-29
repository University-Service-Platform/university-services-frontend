import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TechnicianPage } from '../TechnicianPage';
import * as workOrderService from '@/services/workOrderService';

import type { WorkOrder } from '@/types';

vi.mock('@/auth', () => ({
  useAuth: () => ({
    user: { id: 'TECH-001', email: 'tech@univ.edu', roles: ['TECHNICIAN'] },
    isAuthenticated: true,
  }),
}));

vi.mock('@/services/workOrderService');

const mockAssignedOrders: WorkOrder[] = [
  {
    workOrderId: 'WO-2026-0001',
    requestId: 'REQ-101',
    assignedTechnicianId: 'TECH-001',
    serviceTeam: 'Electrical Team',
    schedule: '2026-09-30 09:00',
    status: 'ASSIGNED',
    createdTime: '2026-09-29T10:00:00Z',
  },
];

describe('TechnicianPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockImplementation(
      () => new Promise(() => {})
    );

    render(<TechnicianPage />);
    expect(screen.getByText(/Loading Technician Work Queue/i)).toBeInTheDocument();
  });

  it('loads and displays assigned work orders', async () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: true,
      data: mockAssignedOrders as any,
    });

    render(<TechnicianPage />);

    await waitFor(() => {
      expect(screen.getByText('WO-2026-0001')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Start Work/i })).toBeInTheDocument();
  });

  it('triggers startWorkOrder when Start Work is clicked', async () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: true,
      data: mockAssignedOrders as any,
    });
    vi.spyOn(workOrderService, 'startWorkOrder').mockResolvedValue({
      success: true,
      data: { ...mockAssignedOrders[0], status: 'IN_PROGRESS' } as any,
    });

    render(<TechnicianPage />);

    await waitFor(() => {
      expect(screen.getByText('WO-2026-0001')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Start Work/i }));

    await waitFor(() => {
      expect(workOrderService.startWorkOrder).toHaveBeenCalledWith('WO-2026-0001');
    });
  });

  it('opens progress note modal and submits note', async () => {
    const inProgressOrders = [{ ...mockAssignedOrders[0], status: 'IN_PROGRESS' }];
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: true,
      data: inProgressOrders as any,
    });
    vi.spyOn(workOrderService, 'addWorkOrderProgressNote').mockResolvedValue({
      success: true,
      data: { ...inProgressOrders[0], actionNotes: 'Replaced fuse' } as any,
    });

    render(<TechnicianPage />);

    await waitFor(() => {
      expect(screen.getByText('WO-2026-0001')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Progress Note/i }));

    expect(screen.getByText(/Add Field Progress Note/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Log diagnostic steps/i);
    fireEvent.change(textarea, { target: { value: 'Replaced fuse' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Note/i }));

    await waitFor(() => {
      expect(workOrderService.addWorkOrderProgressNote).toHaveBeenCalledWith('WO-2026-0001', {
        note: 'Replaced fuse',
      });
    });
  });

  it('opens resolution modal and submits resolution', async () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: true,
      data: mockAssignedOrders as any,
    });
    vi.spyOn(workOrderService, 'recordWorkOrderResolution').mockResolvedValue({
      success: true,
      data: { ...mockAssignedOrders[0], status: 'RESOLVED', resolution: 'Fixed outlet wiring' } as any,
    });

    render(<TechnicianPage />);

    await waitFor(() => {
      expect(screen.getByText('WO-2026-0001')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Record Resolution/i }));

    expect(screen.getByRole('heading', { name: /Record Resolution/i })).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Describe how the issue was fixed/i);
    fireEvent.change(textarea, { target: { value: 'Fixed outlet wiring' } });

    const submitBtn = screen.getAllByRole('button', { name: /Record Resolution/i }).pop()!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(workOrderService.recordWorkOrderResolution).toHaveBeenCalledWith('WO-2026-0001', {
        resolution: 'Fixed outlet wiring',
      });
    });
  });

  it('prevents updating work orders assigned to a different technician', async () => {
    const unassignedToSelfOrder = [
      {
        ...mockAssignedOrders[0],
        workOrderId: 'WO-2026-9999',
        assignedTechnicianId: 'TECH-OTHER',
      },
    ];
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: true,
      data: unassignedToSelfOrder as any,
    });

    render(<TechnicianPage />);

    await waitFor(() => {
      expect(screen.getByText('WO-2026-9999')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Start Work/i }));

    await waitFor(() => {
      expect(screen.getByText(/You are not authorized to update work orders assigned to another technician/i)).toBeInTheDocument();
    });
    expect(workOrderService.startWorkOrder).not.toHaveBeenCalled();
  });
});
