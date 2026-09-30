import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { AppRoutes } from '../AppRoutes';
import * as authModule from '@/auth';
import * as serviceRequestService from '@/services/serviceRequestService';
import * as workOrderService from '@/services/workOrderService';
import type { UserRole, UserProfile } from '@/types';

vi.mock('@/services/serviceRequestService');
vi.mock('@/services/workOrderService');

function mockAuthForRole(role: UserRole) {
  vi.spyOn(authModule, 'useAuth').mockReturnValue({
    isAuthenticated: true,
    user: {
      id: `USER-${role}`,
      email: `${role.toLowerCase()}@univ.edu`,
      firstName: 'Test',
      lastName: 'User',
      roles: [role],
      accountStatus: 'ACTIVE',
    } as UserProfile,
    roles: [role],
    permissions: [],
    accountStatus: 'ACTIVE',
    isAccountActive: true,
    isAccountInactive: false,
    isLoading: false,
    error: null,
    hasRole: (roles: UserRole | UserRole[]) => {
      const arr = Array.isArray(roles) ? roles : [roles];
      return arr.includes(role);
    },
    hasPermission: () => false,
    isAuthorized: (requiredRoles?: UserRole[]) => {
      if (!requiredRoles || requiredRoles.length === 0) return true;
      return requiredRoles.includes(role);
    },
    setAuthUser: vi.fn(),
    logout: vi.fn(),
  });
}

function renderAppRoute(initialEntry: string) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>
  );
}

describe('AppRoutes Role Protection & Authorization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(serviceRequestService, 'getMyServiceRequests').mockResolvedValue({
      success: true,
      data: [],
    });
    vi.spyOn(serviceRequestService, 'getServiceRequestSummary').mockResolvedValue({
      success: true,
      data: {},
    });
    vi.spyOn(workOrderService, 'getWorkOrders').mockResolvedValue({
      success: true,
      data: [],
    });
    vi.spyOn(workOrderService, 'getWorkOrderSummary').mockResolvedValue({
      success: true,
      data: {},
    });
  });

  describe('SERVICE_DESK_OFFICER Role', () => {
    beforeEach(() => {
      mockAuthForRole('SERVICE_DESK_OFFICER');
    });

    it('can access /triage', async () => {
      renderAppRoute('/triage');
      await waitFor(() => {
        expect(screen.getByText(/Service Desk Request Triage/i)).toBeInTheDocument();
      });
    });

    it('can access /work-orders', async () => {
      renderAppRoute('/work-orders');
      await waitFor(() => {
        expect(screen.getByText(/Work Orders Management/i)).toBeInTheDocument();
      });
    });

    it('can access /assignments', async () => {
      renderAppRoute('/assignments');
      await waitFor(() => {
        expect(screen.getByText(/Technician Assignment Dispatch View/i)).toBeInTheDocument();
      });
    });

    it('can access /service-dashboard', async () => {
      renderAppRoute('/service-dashboard');
      await waitFor(() => {
        expect(screen.getByText(/Service Desk Analytics/i)).toBeInTheDocument();
      });
    });
  });

  describe('ADMIN_STAFF Role', () => {
    beforeEach(() => {
      mockAuthForRole('ADMIN_STAFF');
    });

    it('can access /service-dashboard', async () => {
      renderAppRoute('/service-dashboard');
      await waitFor(() => {
        expect(screen.getByText(/Service Desk Analytics/i)).toBeInTheDocument();
      });
    });

    it('cannot access /triage (denied access)', async () => {
      renderAppRoute('/triage');
      await waitFor(() => {
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      });
    });

    it('cannot access /work-orders (denied access)', async () => {
      renderAppRoute('/work-orders');
      await waitFor(() => {
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      });
    });

    it('cannot access /assignments (denied access)', async () => {
      renderAppRoute('/assignments');
      await waitFor(() => {
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      });
    });
  });

  describe('TECHNICIAN Role', () => {
    beforeEach(() => {
      mockAuthForRole('TECHNICIAN');
    });

    it('can access /technician workspace', async () => {
      renderAppRoute('/technician');
      await waitFor(() => {
        expect(screen.getByText(/Technician Field Workspace/i)).toBeInTheDocument();
      });
    });

    it('can access /work-orders', async () => {
      renderAppRoute('/work-orders');
      await waitFor(() => {
        expect(screen.getByText(/Work Orders Management/i)).toBeInTheDocument();
      });
    });

    it('can access /assignments', async () => {
      renderAppRoute('/assignments');
      await waitFor(() => {
        expect(screen.getByText(/Technician Assignment Dispatch View/i)).toBeInTheDocument();
      });
    });

    it('cannot access /triage (denied access)', async () => {
      renderAppRoute('/triage');
      await waitFor(() => {
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      });
    });
  });

  describe('SERVICE Role', () => {
    beforeEach(() => {
      mockAuthForRole('SERVICE');
    });

    it('can access /work-orders', async () => {
      renderAppRoute('/work-orders');
      await waitFor(() => {
        expect(screen.getByText(/Work Orders Management/i)).toBeInTheDocument();
      });
    });

    it('can access /assignments', async () => {
      renderAppRoute('/assignments');
      await waitFor(() => {
        expect(screen.getByText(/Technician Assignment Dispatch View/i)).toBeInTheDocument();
      });
    });

    it('cannot access /triage (denied access)', async () => {
      renderAppRoute('/triage');
      await waitFor(() => {
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      });
    });
  });
});
