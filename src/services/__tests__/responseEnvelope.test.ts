import { afterEach, describe, expect, it, vi } from 'vitest';
import { unwrapData, unwrapList } from '../apiClient';
import { getDepartments } from '../departmentService';
import { getFaculties } from '../facultyService';
import { getProfile } from '../profileService';
import { getServiceUnits } from '../serviceUnitService';
import { createUser, getUsers, updateUser } from '../userService';
import { requestPasswordReset, resetPassword } from '../passwordResetService';
import { jsonResponse, mockFetch } from './testUtils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('unwrapData / unwrapList', () => {
  it('reads the payload inside the { success, data } envelope', () => {
    expect(unwrapData({ success: true, data: { id: 'x' } })).toEqual({ id: 'x' });
    expect(unwrapList({ success: true, data: [{ id: 'x' }] })).toEqual([{ id: 'x' }]);
  });

  it('accepts payloads sent without an envelope', () => {
    expect(unwrapData({ id: 'x' })).toEqual({ id: 'x' });
    expect(unwrapList([{ id: 'x' }])).toEqual([{ id: 'x' }]);
  });

  it('returns null when there is no list', () => {
    expect(unwrapList({ success: true, data: { id: 'x' } })).toBeNull();
    expect(unwrapList(undefined)).toBeNull();
  });
});

describe('list pages read the gateway responses', () => {
  it('loads users from GET /users and maps the Identity fields', async () => {
    mockFetch(jsonResponse(200, { success: true, data: [{
      id: 'usr-student-001', university_id: 'STU001', name: 'Demo Student', first_name: 'Demo',
      last_name: 'Student', email: 'stu001@university.example', status: 'ACTIVE', roles: ['STUDENT'],
    }] }));

    const result = await getUsers();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([{
      id: 'usr-student-001', universityId: 'STU001', email: 'stu001@university.example', firstName: 'Demo',
      lastName: 'Student', roles: ['STUDENT'], accountStatus: 'ACTIVE',
    }]);
  });

  it('loads faculties, departments and service units from the Directory Service', async () => {
    mockFetch(
      jsonResponse(200, { success: true, data: [{ id: 'fac-1', code: 'FCT', name: 'Computing', created_at: '2026-09-30' }] }),
      jsonResponse(200, { success: true, data: [{ id: 'dept-1', code: 'CS', name: 'Computer Science', faculty_id: 'fac-1' }] }),
      jsonResponse(200, { success: true, data: [{ id: 'unit-1', code: 'EVT', name: 'Events Office' }] }),
    );

    expect((await getFaculties()).data).toEqual([
      { id: 'fac-1', code: 'FCT', name: 'Computing', createdAt: '2026-09-30', description: undefined, updatedAt: undefined },
    ]);
    expect((await getDepartments()).data?.[0]).toMatchObject({ id: 'dept-1', facultyId: 'fac-1' });
    expect((await getServiceUnits()).data?.[0]).toMatchObject({ id: 'unit-1', name: 'Events Office' });
  });

  it('loads the own profile from GET /users/profile', async () => {
    mockFetch(jsonResponse(200, { success: true, data: {
      user_id: 'usr-student-001', email: 'stu001@university.example', first_name: 'Demo', last_name: 'Student',
      roles: ['STUDENT'], status: 'ACTIVE',
    } }));

    expect((await getProfile()).data).toMatchObject({ id: 'usr-student-001', firstName: 'Demo', lastName: 'Student' });
  });
});

describe('user create and update send the Identity Service fields', () => {
  it('creates with university ID, one full name and the account type', async () => {
    const fetchMock = mockFetch(jsonResponse(201, { success: true, data: {
      id: 'usr-1', university_id: 'STU010', name: 'Nimal Perera', email: 'n@university.example',
      account_type: 'STUDENT', status: 'ACTIVE', roles: [],
    } }));

    const result = await createUser({
      universityId: ' STU010 ', firstName: 'Nimal', lastName: 'Perera', email: 'n@university.example',
      accountType: 'STUDENT', password: 'Initial-Pass-1',
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      university_id: 'STU010', name: 'Nimal Perera', email: 'n@university.example',
      account_type: 'STUDENT', password: 'Initial-Pass-1',
    });
    expect(result.data).toMatchObject({ id: 'usr-1', universityId: 'STU010', accountType: 'STUDENT' });
  });

  it('updates the name as one field', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { success: true, data: { id: 'usr-1', name: 'A B' } }));

    await updateUser('usr-1', { firstName: 'A', lastName: 'B', email: 'a@university.example', accountType: 'STAFF' });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: 'A B', email: 'a@university.example', account_type: 'STAFF',
    });
  });
});

describe('password reset', () => {
  it('asks for a reset link by email and shows the service message', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { success: true, data: { message: 'Check your inbox.' } }));

    const result = await requestPasswordReset(' n@university.example ');

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/forgot-password$/);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: 'n@university.example' });
    expect(result).toEqual({ success: true, message: 'Check your inbox.' });
  });

  it('sends the token and new password, and reports an expired link', async () => {
    const fetchMock = mockFetch(jsonResponse(400, { success: false, error: {
      code: 'INVALID_RESET_TOKEN', message: 'This password reset link is invalid or has expired.' } }));

    const result = await resetPassword('tok-123', 'New-Pass-456');

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ token: 'tok-123', new_password: 'New-Pass-456' });
    expect(result).toEqual({ success: false, message: 'This password reset link is invalid or has expired.' });
  });
});
