/**
 * Utility functions for University Services Management Platform Foundation
 */

/**
 * Class name builder utility to combine conditional CSS class names cleanly.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format role name for display (e.g., 'DEAN' -> 'Dean')
 */
export function formatRole(role: string): string {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}
