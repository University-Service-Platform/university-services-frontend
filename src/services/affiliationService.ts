import { apiFetch } from './apiClient';
import type {
  Affiliation,
  AffiliationCreatePayload,
  AffiliationUpdatePayload,
  AffiliationServiceResult,
} from '@/types';

export const AFFILIATIONS_API_ENDPOINT =
  import.meta.env.VITE_AFFILIATIONS_API_ENDPOINT || '/affiliations';

function mapRawToAffiliation(raw: Record<string, unknown>): Affiliation {
  const id = String(raw.id || raw.affiliation_id || raw.affiliationId || '');
  const userId = String(raw.userId || raw.user_id || '');
  const departmentId = String(raw.departmentId || raw.department_id || '');

  const facultyId = raw.facultyId || raw.faculty_id ? String(raw.facultyId || raw.faculty_id) : undefined;
  const departmentName = raw.departmentName || raw.department_name ? String(raw.departmentName || raw.department_name) : undefined;
  const facultyName = raw.facultyName || raw.faculty_name ? String(raw.facultyName || raw.faculty_name) : undefined;

  const createdAt = raw.createdAt || raw.created_at ? String(raw.createdAt || raw.created_at) : undefined;
  const updatedAt = raw.updatedAt || raw.updated_at ? String(raw.updatedAt || raw.updated_at) : undefined;

  return {
    id,
    userId,
    departmentId,
    facultyId,
    departmentName,
    facultyName,
    createdAt,
    updatedAt,
  };
}

/**
 * Official Endpoint: GET /affiliations
 */
export async function getAffiliations(): Promise<AffiliationServiceResult<Affiliation[]>> {
  const response = await apiFetch<Record<string, unknown> | Affiliation[]>(AFFILIATIONS_API_ENDPOINT, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Unable to fetch affiliations list.',
    };
  }

  let rawList: unknown[] = [];
  const body = response.data;
  if (Array.isArray(body)) {
    rawList = body;
  } else if (typeof body === 'object' && body !== null) {
    const obj = body as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      rawList = obj.data;
    }
  }

  const data = rawList.map((item) => mapRawToAffiliation(item as Record<string, unknown>));

  return {
    success: true,
    data,
  };
}

/**
 * Official Endpoint: POST /affiliations
 * Body payload uses exact snake_case contract:
 * { "user_id": "...", "department_id": "...", "faculty_id": "..." }
 */
export async function createAffiliation(
  payload: AffiliationCreatePayload
): Promise<AffiliationServiceResult<Affiliation>> {
  const userId = payload.userId?.trim();
  const departmentId = payload.departmentId?.trim();

  if (!userId || !departmentId) {
    return {
      success: false,
      message: 'User ID and Department ID are required to create an affiliation.',
    };
  }

  const bodyPayload: Record<string, string> = {
    user_id: userId,
    department_id: departmentId,
  };

  if (payload.facultyId?.trim()) {
    bodyPayload.faculty_id = payload.facultyId.trim();
  }

  const response = await apiFetch<Record<string, unknown>>(AFFILIATIONS_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(bodyPayload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to create affiliation record.',
    };
  }

  const body = response.data;
  const rawObj = (body.data || body) as Record<string, unknown>;
  const affiliation = mapRawToAffiliation(rawObj);

  return {
    success: true,
    data: affiliation,
    message: 'Affiliation created successfully.',
  };
}

/**
 * Official Endpoint: GET /affiliations/users/{user_id}
 * Returns the user's first affiliation record.
 */
export async function getUserAffiliations(
  userId: string
): Promise<AffiliationServiceResult<Affiliation>> {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) {
    return {
      success: false,
      message: 'User ID is required to fetch user affiliation.',
    };
  }

  const endpoint = `${AFFILIATIONS_API_ENDPOINT}/users/${encodeURIComponent(normalizedUserId)}`;
  const response = await apiFetch<Record<string, unknown>>(endpoint, {
    method: 'GET',
  });

  if (response.status === 404 || !response.data) {
    return {
      success: false,
      message: response.error || 'No affiliation record found for target user.',
    };
  }

  if (response.error) {
    return {
      success: false,
      message: response.error,
    };
  }

  const body = response.data;
  let rawObj: Record<string, unknown> | undefined;

  if (body && typeof body === 'object') {
    if ('data' in body && body.data) {
      if (Array.isArray(body.data) && body.data.length > 0) {
        rawObj = body.data[0] as Record<string, unknown>;
      } else if (typeof body.data === 'object') {
        rawObj = body.data as Record<string, unknown>;
      }
    } else if (Array.isArray(body) && body.length > 0) {
      rawObj = body[0] as Record<string, unknown>;
    } else if (body.id || body.user_id || body.department_id) {
      rawObj = body as Record<string, unknown>;
    }
  }

  if (!rawObj) {
    return {
      success: false,
      message: 'No affiliation record found for target user.',
    };
  }

  const affiliation = mapRawToAffiliation(rawObj);

  return {
    success: true,
    data: affiliation,
  };
}

/**
 * Official Endpoint: GET /affiliations/{affiliation_id}
 */
export async function getAffiliation(
  affiliationId: string
): Promise<AffiliationServiceResult<Affiliation>> {
  const normalizedId = affiliationId?.trim();
  if (!normalizedId) {
    return {
      success: false,
      message: 'Affiliation ID is required.',
    };
  }

  const endpoint = `${AFFILIATIONS_API_ENDPOINT}/${encodeURIComponent(normalizedId)}`;
  const response = await apiFetch<Record<string, unknown>>(endpoint, {
    method: 'GET',
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Affiliation record not found.',
    };
  }

  const body = response.data;
  const rawObj = (body.data || body) as Record<string, unknown>;
  const affiliation = mapRawToAffiliation(rawObj);

  return {
    success: true,
    data: affiliation,
  };
}

/**
 * Official Endpoint: PUT /affiliations/{affiliation_id}
 * Body payload uses exact snake_case contract:
 * { "department_id": "...", "faculty_id": "..." }
 */
export async function updateAffiliation(
  affiliationId: string,
  payload: AffiliationUpdatePayload
): Promise<AffiliationServiceResult<Affiliation>> {
  const normalizedId = affiliationId?.trim();
  const departmentId = payload.departmentId?.trim();

  if (!normalizedId || !departmentId) {
    return {
      success: false,
      message: 'Affiliation ID and Department ID are required to update affiliation.',
    };
  }

  const bodyPayload: Record<string, string> = {
    department_id: departmentId,
  };

  if (payload.facultyId?.trim()) {
    bodyPayload.faculty_id = payload.facultyId.trim();
  }

  const endpoint = `${AFFILIATIONS_API_ENDPOINT}/${encodeURIComponent(normalizedId)}`;
  const response = await apiFetch<Record<string, unknown>>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(bodyPayload),
  });

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to update affiliation record.',
    };
  }

  const body = response.data;
  const rawObj = (body.data || body) as Record<string, unknown>;
  const affiliation = mapRawToAffiliation(rawObj);

  return {
    success: true,
    data: affiliation,
    message: 'Affiliation updated successfully.',
  };
}

/**
 * Official Endpoint: DELETE /affiliations/{affiliation_id}
 */
export async function deleteAffiliation(
  affiliationId: string
): Promise<AffiliationServiceResult<null>> {
  const normalizedId = affiliationId?.trim();
  if (!normalizedId) {
    return {
      success: false,
      message: 'Affiliation ID is required for deletion.',
    };
  }

  const endpoint = `${AFFILIATIONS_API_ENDPOINT}/${encodeURIComponent(normalizedId)}`;
  const response = await apiFetch<null>(endpoint, {
    method: 'DELETE',
  });

  if (response.error) {
    return {
      success: false,
      message: response.error || 'Failed to delete affiliation record.',
    };
  }

  return {
    success: true,
    message: 'Affiliation deleted successfully.',
  };
}
