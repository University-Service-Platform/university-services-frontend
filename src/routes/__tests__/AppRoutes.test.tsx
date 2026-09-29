import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../AppRoutes';
import * as authModule from '@/auth';
import * as serviceRequestService from '@/services/serviceRequestService';
import * as workOrderService from '@/services/workOrderService';
import type { UserRole } from '@/types';

vi.mock('@/services/serviceRequestService');
vi.mock('@/services/workOrderService');

function mockAuthForRole(role: UserRole) {
  vi.spyOn(authModule, 'useAuth').mockReturnValue({
    isAuthenticated: true,
    user: {
      id: `USER-${role}`,
      email: `${role.toLowerCase()}@univ.edu`,
      roles: [role],
      accountStatus: 'ACTIVE',
    } as any,
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
    isAuthorized: (requiredRoles?: UserRole[], _requiredPermissions?: string[]) => {
      if (!requiredRoles || requiredRoles.length === 0) return true;
      return requiredRoles.includes(role);
    },
    setAuthUser: vi.fn(),
    logout: vi.fn(),
  });
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
      render(
        <MemoryRouter initialEntries={['/triage']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Service Desk Request Triage/i)).toBeInTheDocument();
      });
    });

    it('can access /work-orders', async () => {
      render(
        <MemoryRouter initialEntries={['/work-orders']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Work Orders Management/i)).toBeInTheDocument();
      });
    });

    it('can access /assignments', async () => {
      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Technician Assignment Dispatch View/i)).toBeInTheDocument();
      });
    });

    it('can access /service-dashboard', async () => {
      render(
        <MemoryRouter initialEntries={['/service-dashboard']}>
          <AppRoutes />
        </MemoryRouter>
      );
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
      render(
        <MemoryRouter initialEntries={['/service-dashboard']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Service Desk Analytics/i)).toBeInTheDocument();
      });
    });

    it('cannot access /triage (denied access)', async () => {
      render(
        <MemoryRouter initialEntries={['/triage']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      });
    });

    it('cannot access /work-orders (denied access)', async () => {
      render(
        <MemoryRouter initialEntries={['/work-orders']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      });
    });

    it('cannot access /assignments (denied access)', async () => {
      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <AppRoutes />
        </MemoryRouter>
      );
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
      render(
        <MemoryRouter initialEntries={['/technician']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Technician Field Workspace/i)).toBeInTheDocument();
      });
    });

    it('can access /work-orders', async () => {
      render(
        <MemoryRouter initialEntries={['/work-orders']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Work Orders Management/i)).toBeInTheDocument();
      });
    });

    it('can access /assignments', async () => {
      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Technician Assignment Dispatch View/i)).toBeInTheDocument();
      });
    });

    it('cannot access /triage (denied access)', async () => {
      render(
        <MemoryRouter initialEntries={['/triage']}>
          <AppRoutes />
        </MemoryRouter>
      );
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
      render(
        <MemoryRouter initialEntries={['/work-orders']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Work Orders Management/i)).toBeInTheDocument();
      });
    });

    it('can access /assignments', async () => {
      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Technician Assignment Dispatch View/i)).toBeInTheDocument();
      });
    });

    it('cannot access /triage (denied access)', async () => {
      render(
        <MemoryRouter initialEntries={['/triage']}>
          <AppRoutes />
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      });
    });
  });
});
