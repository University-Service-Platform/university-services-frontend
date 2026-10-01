import { apiFetch, unwrapData } from './apiClient';

export interface PasswordResetResult {
  success: boolean;
  message: string;
}

const FALLBACK_REQUEST_MESSAGE =
  "If an account with that email exists, we've sent a link to reset its password. Check your inbox and spam folder.";

/** POST /auth/forgot-password: emails a one-time link. The answer is the same for unknown emails. */
export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  const response = await apiFetch<unknown>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
  if (response.error) {
    return { success: false, message: response.error };
  }
  const data = unwrapData<{ message?: string }>(response.data);
  return { success: true, message: data?.message || FALLBACK_REQUEST_MESSAGE };
}

/** POST /auth/reset-password: sets the new password with the token from the emailed link. */
export async function resetPassword(token: string, newPassword: string): Promise<PasswordResetResult> {
  const response = await apiFetch<unknown>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (response.error) {
    return { success: false, message: response.error };
  }
  const data = unwrapData<{ message?: string }>(response.data);
  return { success: true, message: data?.message || 'Your password has been changed. You can sign in now.' };
}
