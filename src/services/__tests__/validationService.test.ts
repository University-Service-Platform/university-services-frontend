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
 * Task 3 Integration Test Suite for Cross-Team Validation API Service
 */
export async function runValidationServiceTests(): Promise<boolean> {
  try {
    // 1. Invalid input validation test (HTTP 400 Bad Request)
    const emptyResult = await validateUserIdentity('');
    assertEqual(emptyResult.success, false, 'Invalid User ID - success status');
    assertEqual(emptyResult.status, 400, 'Invalid User ID - HTTP status');

    // 2. Role validation invalid input test
    const emptyRoleResult = await validateUserRole('', ['STUDENT']);
    assertEqual(emptyRoleResult.success, false, 'Invalid User ID Role - success status');
    assertEqual(emptyRoleResult.status, 400, 'Invalid User ID Role - HTTP status');

    // 3. Account status validation invalid input test
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
