/**
 * Group 5 Validation Utilities for Form and Entity Inputs
 */

export interface ValidationRuleResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validate university or standard email format
 */
export function validateEmail(email: string): ValidationRuleResult {
  if (!email || !email.trim()) {
    return { isValid: false, message: 'Email address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }
  return { isValid: true };
}

/**
 * Validate optional or required phone numbers
 */
export function validatePhone(phone?: string, isRequired = false): ValidationRuleResult {
  if (!phone || !phone.trim()) {
    if (isRequired) {
      return { isValid: false, message: 'Phone number is required.' };
    }
    return { isValid: true };
  }
  const phoneRegex = /^[+()0-9\s-]{7,20}$/;
  if (!phoneRegex.test(phone.trim())) {
    return { isValid: false, message: 'Please enter a valid phone number (e.g. +94 71 234 5678).' };
  }
  return { isValid: true };
}

/**
 * Validate uppercase entity codes (e.g. FOS, DCS, ICTC, ADMIN)
 */
export function validateEntityCode(code: string, minLength = 2, maxLength = 10): ValidationRuleResult {
  if (!code || !code.trim()) {
    return { isValid: false, message: 'Entity code is required.' };
  }
  const cleanCode = code.trim();
  if (cleanCode.length < minLength || cleanCode.length > maxLength) {
    return {
      isValid: false,
      message: `Code must be between ${minLength} and ${maxLength} characters.`,
    };
  }
  if (!/^[A-Za-z0-9_-]+$/.test(cleanCode)) {
    return {
      isValid: false,
      message: 'Code can only contain alphanumeric characters, hyphens, and underscores.',
    };
  }
  return { isValid: true };
}

/**
 * Validate required text field
 */
export function validateRequired(value: string, fieldName = 'Field'): ValidationRuleResult {
  if (!value || !value.trim()) {
    return { isValid: false, message: `${fieldName} is required.` };
  }
  return { isValid: true };
}
