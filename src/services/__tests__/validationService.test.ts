import { describe, it, expect } from 'vitest';
import {
  validateUserIdentity,
  validateUserRole,
  validateAccountStatus,
} from '../validationService';

describe('validationService Integration Tests', () => {
  it('validates user identity invalid input', async () => {
    const emptyResult = await validateUserIdentity('');
    expect(emptyResult.success).toBe(false);
    expect(emptyResult.status).toBe(400);
  });

  it('validates user role invalid input', async () => {
    const emptyRoleResult = await validateUserRole('', ['STUDENT']);
    expect(emptyRoleResult.success).toBe(false);
    expect(emptyRoleResult.status).toBe(400);
  });

  it('validates account status invalid input', async () => {
    const emptyStatusResult = await validateAccountStatus('');
    expect(emptyStatusResult.success).toBe(false);
    expect(emptyStatusResult.status).toBe(400);
  });
});
