import {
  validateUserIdentity,
  validateUserRole,
  validateAccountStatus,
} from '../validationService';

function assertEqual<T>(actual: T, expected: T, testName: string): void {
  if (actual !== expected) {
    throw new Error(`[TEST FAILED] ${testName}: Expected ${String(expected)}, got ${String(actual)}`);
  }
}

/**
 * Lightweight integration-boundary checks that do not call the backend.
 */
export async function runValidationServiceTests(): Promise<boolean> {
  try {
    const emptyResult = await validateUserIdentity('');
    assertEqual(emptyResult.success, false, 'Invalid User ID - success status');
    assertEqual(emptyResult.status, 400, 'Invalid User ID - HTTP status');

    const emptyRoleResult = await validateUserRole('', ['STUDENT']);
    assertEqual(emptyRoleResult.success, false, 'Invalid User ID Role - success status');
    assertEqual(emptyRoleResult.status, 400, 'Invalid User ID Role - HTTP status');

    const emptyRolesResult = await validateUserRole('USER-1001', []);
    assertEqual(emptyRolesResult.success, false, 'Empty role list - success status');
    assertEqual(emptyRolesResult.status, 400, 'Empty role list - HTTP status');

    const emptyStatusResult = await validateAccountStatus('');
    assertEqual(emptyStatusResult.success, false, 'Invalid User ID Account Status - success status');
    assertEqual(emptyStatusResult.status, 400, 'Invalid User ID Account Status - HTTP status');

    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    return false;
  }
}
