import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TriagePage } from '../TriagePage';
import * as serviceRequestService from '@/services/serviceRequestService';
import type { ServiceRequest } from '@/types';

vi.mock('@/services/serviceRequestService');

const mockRequests: ServiceRequest[] = [
  {
    requestId: 'REQ-001',
    requesterId: 'USER-100',
    category: 'FACILITY',
    location: 'Block A, Room 101',
    priority: 'MEDIUM',
    description: 'Broken window latch',
    status: 'NEW',
    responsibleServiceUnit: 'Facilities',
    reportedTime: '2026-09-29T10:00:00Z',
  },
];

describe('TriagePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    vi.spyOn(serviceRequestService, 'getMyServiceRequests').mockImplementation(
      () => new Promise(() => {}) // pending promise
    );

    render(<TriagePage />);
    expect(screen.getByText(/Loading Triage Queue/i)).toBeInTheDocument();
  });

  it('loads and displays requests list', async () => {
    vi.spyOn(serviceRequestService, 'getMyServiceRequests').mockResolvedValue({
      success: true,
      data: mockRequests,
    });

    render(<TriagePage />);

    await waitFor(() => {
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
    });
    expect(screen.getByText(/FACILITY at Block A, Room 101/i)).toBeInTheDocument();
  });

  it('displays empty state when no requests return', async () => {
    vi.spyOn(serviceRequestService, 'getMyServiceRequests').mockResolvedValue({
      success: true,
      data: [],
    });

    render(<TriagePage />);

    await waitFor(() => {
      expect(screen.getByText(/No Requests Found/i)).toBeInTheDocument();
    });
  });

  it('displays API error state when fetching fails', async () => {
    vi.spyOn(serviceRequestService, 'getMyServiceRequests').mockResolvedValue({
      success: false,
      message: 'Network error 500',
    });

    render(<TriagePage />);

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Triage Queue')).toBeInTheDocument();
      expect(screen.getByText('Network error 500')).toBeInTheDocument();
    });
  });

  it('opens triage form and submits triage payload successfully', async () => {
    vi.spyOn(serviceRequestService, 'getMyServiceRequests').mockResolvedValue({
      success: true,
      data: mockRequests,
    });
    vi.spyOn(serviceRequestService, 'triageServiceRequest').mockResolvedValue({
      success: true,
      data: { ...mockRequests[0], status: 'ASSIGNED', responsibleServiceUnit: 'Facilities Team' },
    });

    render(<TriagePage />);

    await waitFor(() => {
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
    });

    // Inspect request
    fireEvent.click(screen.getByText('Inspect'));

    expect(screen.getByText(/Triage Ticket: REQ-001/i)).toBeInTheDocument();

    // Submit Triage
    fireEvent.click(screen.getByRole('button', { name: /Submit Triage/i }));

    await waitFor(() => {
      expect(serviceRequestService.triageServiceRequest).toHaveBeenCalledWith('REQ-001', {
        category: 'FACILITY',
        priority: 'MEDIUM',
        responsibleServiceUnit: 'Facilities',
      });
    });
  });

  it('opens rejection modal and submits rejection payload', async () => {
    vi.spyOn(serviceRequestService, 'getMyServiceRequests').mockResolvedValue({
      success: true,
      data: mockRequests,
    });
    vi.spyOn(serviceRequestService, 'rejectServiceRequest').mockResolvedValue({
      success: true,
      data: { ...mockRequests[0], status: 'REJECTED', rejectionReason: 'Out of scope' },
    });

    render(<TriagePage />);

    await waitFor(() => {
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Inspect'));
    fireEvent.click(screen.getByRole('button', { name: /Reject/i }));

    expect(screen.getByText(/Reject Service Request REQ-001/i)).toBeInTheDocument();

    // Type rejection reason
    const textarea = screen.getByPlaceholderText(/e.g. Duplicate request/i);
    fireEvent.change(textarea, { target: { value: 'Out of scope request' } });

    fireEvent.click(screen.getByRole('button', { name: /Confirm Rejection/i }));

    await waitFor(() => {
      expect(serviceRequestService.rejectServiceRequest).toHaveBeenCalledWith('REQ-001', {
        rejectionReason: 'Out of scope request',
      });
    });
  });
});
