import { checkAccountStatus, updateAccountStatus } from '../accountStatusService';

function assertEqual<T>(actual: T, expected: T, testName: string): void {
  if (actual !== expected) {
    throw new Error(`[TEST FAILED] ${testName}: Expected ${String(expected)}, got ${String(actual)}`);
  }
}

/**
 * Lightweight input checks for the account status service that do not call the backend.
 */
export async function runAccountStatusServiceTests(): Promise<boolean> {
  try {
    const emptyCheck = await checkAccountStatus('');
    assertEqual(emptyCheck.success, false, 'Empty User ID check - success status');

    const blankCheck = await checkAccountStatus('   ');
    assertEqual(blankCheck.success, false, 'Whitespace User ID check - success status');

    const emptyUpdate = await updateAccountStatus('', 'ACTIVE');
    assertEqual(emptyUpdate.success, false, 'Empty User ID update - success status');

    const blankUpdate = await updateAccountStatus('  \t', 'INACTIVE');
    assertEqual(blankUpdate.success, false, 'Whitespace User ID update - success status');
    assertEqual(
      blankUpdate.message,
      'User ID is required to update account status.',
      'Whitespace User ID update - message'
    );

    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    return false;
  }
}
