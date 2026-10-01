import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceDashboardPage } from '../ServiceDashboardPage';
import * as serviceRequestService from '@/services/serviceRequestService';
import * as workOrderService from '@/services/workOrderService';

vi.mock('@/services/serviceRequestService');
vi.mock('@/services/workOrderService');

describe('ServiceDashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', async () => {
    vi.spyOn(serviceRequestService, 'getServiceRequestSummary').mockImplementation(
      () => new Promise(() => {})
    );
    vi.spyOn(workOrderService, 'getWorkOrderSummary').mockImplementation(
      () => new Promise(() => {})
    );

    render(<ServiceDashboardPage />);
    expect(screen.getByText(/Loading Service Request Telemetry/i)).toBeInTheDocument();
  });

  it('loads and displays summary counts', async () => {
    vi.spyOn(serviceRequestService, 'getServiceRequestSummary').mockResolvedValue({
      success: true,
      data: {
        NEW: 10,
        IN_PROGRESS: 15,
        RESOLVED: 25,
      },
    });
    vi.spyOn(workOrderService, 'getWorkOrderSummary').mockResolvedValue({
      success: true,
      data: { ASSIGNED: 5, RESOLVED: 15 },
    });

    await act(async () => {
      render(<ServiceDashboardPage />);
    });

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
    vi.spyOn(workOrderService, 'getWorkOrderSummary').mockResolvedValue({
      success: true,
      data: {},
    });

    await act(async () => {
      render(<ServiceDashboardPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Service Request Summary Error')).toBeInTheDocument();
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
    vi.spyOn(workOrderService, 'getWorkOrderSummary').mockResolvedValue({
      success: true,
      data: {},
    });

    await act(async () => {
      render(<ServiceDashboardPage />);
    });

    await waitFor(() => {
      expect(serviceRequestService.getServiceRequestSummary).toHaveBeenCalledWith('status');
    });

    const select = screen.getByLabelText(/Service Request Aggregation GroupBy/i);
    await act(async () => {
      fireEvent.change(select, { target: { value: 'category' } });
    });

    await waitFor(() => {
      expect(serviceRequestService.getServiceRequestSummary).toHaveBeenCalledWith('category');
    });
  });
});
