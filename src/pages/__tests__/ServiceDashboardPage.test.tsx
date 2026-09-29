import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceDashboardPage } from '../ServiceDashboardPage';
import * as serviceRequestService from '@/services/serviceRequestService';

vi.mock('@/services/serviceRequestService');

describe('ServiceDashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    vi.spyOn(serviceRequestService, 'getServiceRequestSummary').mockImplementation(
      () => new Promise(() => {})
    );

    render(<ServiceDashboardPage />);
    expect(screen.getByText(/Loading Analytics Telemetry/i)).toBeInTheDocument();
  });

  it('loads and displays summary counts and breakdown table', async () => {
    vi.spyOn(serviceRequestService, 'getServiceRequestSummary').mockResolvedValue({
      success: true,
      data: {
        NEW: 10,
        IN_PROGRESS: 15,
        RESOLVED: 25,
      },
    });

    render(<ServiceDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument(); // total count
    });

    expect(screen.getAllByText('NEW').length).toBeGreaterThan(0);
    expect(screen.getAllByText('IN_PROGRESS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RESOLVED').length).toBeGreaterThan(0);
  });

  it('displays API error state when summary fetch fails', async () => {
    vi.spyOn(serviceRequestService, 'getServiceRequestSummary').mockResolvedValue({
      success: false,
      message: 'Summary endpoint error 500',
    });

    render(<ServiceDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Telemetry Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Summary endpoint error 500')).toBeInTheDocument();
    });
  });

  it('changes grouping dimension when select dropdown changes', async () => {
    vi.spyOn(serviceRequestService, 'getServiceRequestSummary').mockResolvedValue({
      success: true,
      data: {
        FACILITY: 20,
        IT: 30,
      },
    });

    render(<ServiceDashboardPage />);

    await waitFor(() => {
      expect(serviceRequestService.getServiceRequestSummary).toHaveBeenCalledWith('status');
    });

    const select = screen.getByLabelText(/Aggregation Dimension/i);
    fireEvent.change(select, { target: { value: 'category' } });

    await waitFor(() => {
      expect(serviceRequestService.getServiceRequestSummary).toHaveBeenCalledWith('category');
    });
  });
});
