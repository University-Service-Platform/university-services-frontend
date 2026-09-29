import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssignmentsPage } from '../AssignmentsPage';
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

describe('AssignmentsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockImplementation(
      () => new Promise(() => {})
    );

    render(<AssignmentsPage />);
    expect(screen.getByText(/Loading Work Order Assignments/i)).toBeInTheDocument();
  });

  it('loads and displays technician assignments', async () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: true,
      data: mockWorkOrders as any,
    });

    render(<AssignmentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Technician Assignment Dispatch View/i)).toBeInTheDocument();
      expect(screen.getByText('TECH-001')).toBeInTheDocument();
      expect(screen.getByText('WO-2026-0001')).toBeInTheDocument();
    });
  });

  it('displays empty state when no assignments exist', async () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: true,
      data: [],
    });

    render(<AssignmentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/No Work Order Assignments/i)).toBeInTheDocument();
    });
  });

  it('displays error state when fetching assignments fails with 403 authorization error', async () => {
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: false,
      status: 403,
      message: 'You are not authorized to perform this action.',
    });

    render(<AssignmentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to Load Assignments/i)).toBeInTheDocument();
      expect(screen.getByText(/You are not authorized to perform this action/i)).toBeInTheDocument();
    });
  });
});
