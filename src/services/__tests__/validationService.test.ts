import {
  validateUserIdentity,
  validateUserRole,
  validateAccountStatus,
  validateUserAffiliation,
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

    const blankIdentityResult = await validateUserIdentity('   ');
    assertEqual(blankIdentityResult.success, false, 'Whitespace User ID - success status');
    assertEqual(blankIdentityResult.status, 400, 'Whitespace User ID - HTTP status');

    const blankStatusResult = await validateAccountStatus('\t ');
    assertEqual(blankStatusResult.success, false, 'Whitespace User ID Account Status - success status');
    assertEqual(blankStatusResult.status, 400, 'Whitespace User ID Account Status - HTTP status');

    const singleRoleResult = await validateUserRole(' ', 'STUDENT');
    assertEqual(singleRoleResult.success, false, 'Single role with blank User ID - success status');
    assertEqual(singleRoleResult.status, 400, 'Single role with blank User ID - HTTP status');

    const emptyAffiliationResult = await validateUserAffiliation('', { departmentId: 'DEPT-1' });
    assertEqual(emptyAffiliationResult.success, false, 'Invalid User ID Affiliation - success status');
    assertEqual(emptyAffiliationResult.status, 400, 'Invalid User ID Affiliation - HTTP status');

    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    return false;
  }
}
