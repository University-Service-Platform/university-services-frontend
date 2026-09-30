import { describe, it, expect } from 'vitest';
import {
  validateUserIdentity,
  validateUserRole,
  validateAccountStatus,
  validateUserAffiliation,
} from '../validationService';

describe('validationService Integration Tests', () => {
  it('validates user identity invalid input', async () => {
    const emptyResult = await validateUserIdentity('');
    expect(emptyResult.success).toBe(false);
    expect(emptyResult.status).toBe(400);

    const blankIdentityResult = await validateUserIdentity('   ');
    expect(blankIdentityResult.success).toBe(false);
    expect(blankIdentityResult.status).toBe(400);
  });

  it('validates user role invalid input', async () => {
    const emptyRoleResult = await validateUserRole('', ['STUDENT']);
    expect(emptyRoleResult.success).toBe(false);
    expect(emptyRoleResult.status).toBe(400);

    const emptyRolesResult = await validateUserRole('USER-1001', []);
    expect(emptyRolesResult.success).toBe(false);
    expect(emptyRolesResult.status).toBe(400);

    const singleRoleResult = await validateUserRole(' ', 'STUDENT');
    expect(singleRoleResult.success).toBe(false);
    expect(singleRoleResult.status).toBe(400);
  });

  it('validates account status invalid input', async () => {
    const emptyStatusResult = await validateAccountStatus('');
    expect(emptyStatusResult.success).toBe(false);
    expect(emptyStatusResult.status).toBe(400);

    const blankStatusResult = await validateAccountStatus('\t ');
    expect(blankStatusResult.success).toBe(false);
    expect(blankStatusResult.status).toBe(400);
  });

  it('validates user affiliation invalid input', async () => {
    const emptyAffiliationResult = await validateUserAffiliation('', { departmentId: 'DEPT-1' });
    expect(emptyAffiliationResult.success).toBe(false);
    expect(emptyAffiliationResult.status).toBe(400);
  });
});

export async function runValidationServiceTests(): Promise<boolean> {
  try {
    const emptyResult = await validateUserIdentity('');
    if (emptyResult.success !== false || emptyResult.status !== 400) return false;

    const emptyRoleResult = await validateUserRole('', ['STUDENT']);
    if (emptyRoleResult.success !== false || emptyRoleResult.status !== 400) return false;

    const emptyStatusResult = await validateAccountStatus('');
    if (emptyStatusResult.success !== false || emptyStatusResult.status !== 400) return false;

    const emptyAffiliationResult = await validateUserAffiliation('', { departmentId: 'DEPT-1' });
    if (emptyAffiliationResult.success !== false || emptyAffiliationResult.status !== 400) return false;

    return true;
  } catch {
    return false;
  }
}
