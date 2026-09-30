import type { Department, Faculty, ServiceUnit } from '@/types';

/**
 * The Directory Service returns snake_case fields (faculty_id, created_at); the UI types use camelCase.
 * Both spellings are accepted so the pages keep working if a service switches style.
 */
function text(raw: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return undefined;
}

export function mapFaculty(raw: Record<string, unknown>): Faculty {
  return {
    id: text(raw, 'id', 'faculty_id') ?? '',
    name: text(raw, 'name') ?? '',
    code: text(raw, 'code') ?? '',
    description: text(raw, 'description'),
    createdAt: text(raw, 'createdAt', 'created_at'),
    updatedAt: text(raw, 'updatedAt', 'updated_at'),
  };
}

export function mapServiceUnit(raw: Record<string, unknown>): ServiceUnit {
  return {
    id: text(raw, 'id', 'service_unit_id', 'unit_id') ?? '',
    name: text(raw, 'name') ?? '',
    code: text(raw, 'code') ?? '',
    description: text(raw, 'description'),
    createdAt: text(raw, 'createdAt', 'created_at'),
    updatedAt: text(raw, 'updatedAt', 'updated_at'),
  };
}

export function mapDepartment(raw: Record<string, unknown>): Department {
  return {
    id: text(raw, 'id', 'department_id') ?? '',
    name: text(raw, 'name') ?? '',
    code: text(raw, 'code') ?? '',
    facultyId: text(raw, 'facultyId', 'faculty_id') ?? '',
    facultyName: text(raw, 'facultyName', 'faculty_name'),
    description: text(raw, 'description'),
    createdAt: text(raw, 'createdAt', 'created_at'),
    updatedAt: text(raw, 'updatedAt', 'updated_at'),
  };
}
