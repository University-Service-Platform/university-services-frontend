import { apiFetch } from './apiClient';
import type { ServiceRequest } from '@/types';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Service Request DTO payloads are not yet documented in the repository.
 * The payload structures below represent an unconfirmed integration boundary subject to change.
 */
export interface ServiceRequestResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend API contract for Service Request endpoints is not yet documented in the repository.
 * The endpoint constant below serves as a placeholder integration boundary that will be updated
 * once the official backend OpenAPI/Swagger specification is provided by the backend team.
 */
export const SERVICE_REQUESTS_API_ENDPOINT = import.meta.env.VITE_SERVICE_REQUESTS_API_ENDPOINT || '/requests/my';

const MOCK_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: 'REQ-2026-001',
    title: 'Projector not working in Lecture Hall A1',
    category: 'IT Support',
    submittedDate: '2026-09-20',
    status: 'NEW',
  },
  {
    id: 'REQ-2026-002',
    title: 'Air conditioning repair in Lab 3',
    category: 'Facilities Maintenance',
    submittedDate: '2026-09-18',
    status: 'IN_PROGRESS',
  },
  {
    id: 'REQ-2026-003',
    title: 'Network connectivity issue in Block B',
    category: 'Network Services',
    submittedDate: '2026-09-15',
    status: 'ASSIGNED',
  },
  {
    id: 'REQ-2026-004',
    title: 'Software license request for MATLAB',
    category: 'Software Licensing',
    submittedDate: '2026-09-10',
    status: 'RESOLVED',
  },
  {
    id: 'REQ-2026-005',
    title: 'Replacement of broken desk chair',
    category: 'Furniture & Equipment',
    submittedDate: '2026-09-05',
    status: 'CLOSED',
  },
  {
    id: 'REQ-2026-006',
    title: 'Request for custom server access',
    category: 'IT Support',
    submittedDate: '2026-09-01',
    status: 'REJECTED',
  },
];

export async function getMyServiceRequests(): Promise<ServiceRequestResult<ServiceRequest[]>> {
  const response = await apiFetch<ServiceRequest[]>(SERVICE_REQUESTS_API_ENDPOINT, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: true,
      data: MOCK_SERVICE_REQUESTS,
      message: 'Service requests fetched successfully (mock data).',
    };
  }

  return {
    success: true,
    data: response.data,
  };
}
