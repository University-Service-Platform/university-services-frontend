import type { ServiceRequest } from '@/types';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Service Request DTO payloads and endpoint contracts are not yet documented in the repository.
 * The service layer below provides mock integration data boundary for frontend development.
 */
export interface ServiceRequestServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export const SERVICE_REQUESTS_API_ENDPOINT =
  import.meta.env.VITE_SERVICE_REQUESTS_API_ENDPOINT || '/service-requests/my-requests';

const MOCK_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: 'SR-2041',
    title: 'Projector not working — Lab 3',
    category: 'IT',
    submittedDate: '2 days ago',
    status: 'In progress',
    location: 'Engineering Block, Lab 3',
    priority: 'Medium',
    assignedTo: 'R. Fernando (IT Support)',
    description: 'Projector in Lab 3 does not power on. Checked the remote and power cable, issue persists.',
    attachmentName: 'photo_projector.jpg',
    timeline: [
      { label: 'Reported', timestamp: 'Sep 7, 10:12 AM', completed: true },
      { label: 'Acknowledged', timestamp: 'Sep 7, 2:30 PM', completed: true },
      { label: 'Assigned to R. Fernando', timestamp: 'Sep 8, 9:00 AM', completed: true },
      { label: 'In progress', timestamp: 'Sep 9, 8:45 AM', completed: true, note: 'Work started, Sep 9, 8:45 AM' },
      { label: 'Resolved', completed: false },
    ],
  },
  {
    id: 'SR-2038',
    title: 'Leaking pipe — Hostel Block B',
    category: 'Facility',
    submittedDate: '5 days ago',
    status: 'Resolved',
    location: 'Hostel Block B, Room 104',
    priority: 'High',
    assignedTo: 'N. Wickrama (Facilities)',
    description: 'Water pipe under the bathroom sink is leaking severely onto the floor.',
    attachmentName: 'pipe_leak.jpg',
    resolution: 'Replaced faulty pipe joint. Tested water flow and verified no further leakage.',
    timeline: [
      { label: 'Reported', timestamp: 'Sep 2, 8:30 AM', completed: true },
      { label: 'Acknowledged', timestamp: 'Sep 2, 11:15 AM', completed: true },
      { label: 'Assigned to N. Wickrama', timestamp: 'Sep 3, 9:00 AM', completed: true },
      { label: 'In progress', timestamp: 'Sep 3, 1:30 PM', completed: true },
      { label: 'Resolved', timestamp: 'Sep 5, 4:20 PM', completed: true, note: 'Replaced faulty pipe joint.' },
    ],
  },
  {
    id: 'SR-2029',
    title: 'Broken chair — Lecture Hall 2',
    category: 'Equipment',
    submittedDate: '1 week ago',
    status: 'Assigned',
    location: 'Lecture Hall 2, Row 4',
    priority: 'Low',
    assignedTo: 'K. Jayasuriya (Maintenance)',
    description: 'Armrest of chair #42 is broken and has sharp exposed edges.',
    timeline: [
      { label: 'Reported', timestamp: 'Sep 18, 9:15 AM', completed: true },
      { label: 'Acknowledged', timestamp: 'Sep 18, 1:45 PM', completed: true },
      { label: 'Assigned to K. Jayasuriya', timestamp: 'Sep 19, 10:30 AM', completed: true },
      { label: 'In progress', timestamp: 'Sep 19, 2:00 PM', completed: true },
      { label: 'Resolved', completed: false },
    ],
  },
  {
    id: 'SR-2015',
    title: 'Wi-Fi not reachable — Library 2nd floor',
    category: 'IT',
    submittedDate: '3 weeks ago',
    status: 'Closed',
    location: 'Library 2nd floor, West Wing',
    priority: 'Medium',
    assignedTo: 'R. Fernando (IT Support)',
    description: 'Access point AP-L2-W is offline causing no Wi-Fi coverage.',
    resolution: 'Rebooted access point and updated firmware. Signal verified.',
    timeline: [
      { label: 'Reported', timestamp: 'Sep 1, 10:00 AM', completed: true },
      { label: 'Acknowledged', timestamp: 'Sep 1, 2:15 PM', completed: true },
      { label: 'Assigned to R. Fernando', timestamp: 'Sep 2, 9:30 AM', completed: true },
      { label: 'In progress', timestamp: 'Sep 2, 11:00 AM', completed: true },
      { label: 'Resolved', timestamp: 'Sep 6, 3:45 PM', completed: true },
    ],
  },
  {
    id: 'SR-2008',
    title: 'AC remote missing — Seminar Room 1',
    category: 'Facility',
    submittedDate: '1 month ago',
    status: 'Closed',
    location: 'Main Academic Building, Seminar Room 1',
    priority: 'Low',
    assignedTo: 'N. Wickrama (Facilities)',
    description: 'AC remote control unit is missing from wall mount.',
    resolution: 'Issued replacement remote control and secured wall bracket.',
    timeline: [
      { label: 'Reported', timestamp: 'Aug 25, 11:30 AM', completed: true },
      { label: 'Acknowledged', timestamp: 'Aug 25, 3:00 PM', completed: true },
      { label: 'Assigned to N. Wickrama', timestamp: 'Aug 26, 9:15 AM', completed: true },
      { label: 'In progress', timestamp: 'Aug 26, 1:45 PM', completed: true },
      { label: 'Resolved', timestamp: 'Aug 27, 2:10 PM', completed: true },
    ],
  },
];

export async function getMyServiceRequests(): Promise<ServiceRequestServiceResult<ServiceRequest[]>> {
  return Promise.resolve({
    success: true,
    data: MOCK_SERVICE_REQUESTS,
    message: 'Submitted service requests retrieved successfully.',
  });
}

export async function getServiceRequestById(id: string): Promise<ServiceRequestServiceResult<ServiceRequest>> {
  const request = MOCK_SERVICE_REQUESTS.find((req) => req.id.toLowerCase() === id.toLowerCase());
  if (!request) {
    return Promise.resolve({
      success: false,
      message: `Service request with ID '${id}' was not found.`,
    });
  }
  return Promise.resolve({
    success: true,
    data: request,
    message: 'Service request details retrieved successfully.',
  });
}

export interface ServiceRequestCreatePayload {
  category: string;
  location: string;
  priority: string;
  description: string;
  attachmentFileName?: string;
}

export async function createServiceRequest(
  payload: ServiceRequestCreatePayload
): Promise<ServiceRequestServiceResult<ServiceRequest>> {
  if (!payload.category || !payload.category.trim()) {
    return Promise.resolve({
      success: false,
      message: 'Category is required.',
    });
  }

  if (!payload.location || !payload.location.trim()) {
    return Promise.resolve({
      success: false,
      message: 'Location is required.',
    });
  }

  if (!payload.description || !payload.description.trim()) {
    return Promise.resolve({
      success: false,
      message: 'Description is required.',
    });
  }

  const randomFourDigit = Math.floor(1000 + Math.random() * 9000);
  const refId = `SR-${randomFourDigit}`;

  const newRequest: ServiceRequest = {
    id: refId,
    title: `${payload.category} Issue — ${payload.location.trim()}`,
    category: payload.category.trim(),
    location: payload.location.trim(),
    priority: payload.priority || 'Medium',
    description: payload.description.trim(),
    attachmentName: payload.attachmentFileName || undefined,
    submittedDate: 'Just now',
    status: 'New',
    timeline: [
      { label: 'Reported', timestamp: 'Just now', completed: true },
      { label: 'Acknowledged', completed: false },
      { label: 'Assigned', completed: false },
      { label: 'In progress', completed: false },
      { label: 'Resolved', completed: false },
    ],
  };

  MOCK_SERVICE_REQUESTS.unshift(newRequest);

  return Promise.resolve({
    success: true,
    data: newRequest,
    message: `Service request ${refId} created successfully.`,
  });
}
