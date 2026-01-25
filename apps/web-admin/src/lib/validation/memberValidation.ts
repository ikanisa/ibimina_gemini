/**
 * Member Validation
 * 
 * Validation rules and utilities for member data
 */

import { validateAndNormalizePhone } from './phoneValidation';

export interface MemberValidationErrors {
  [key: string]: string | undefined;
  full_name?: string;
  phone?: string;
  branch?: string;
}

/**
 * Validate member creation/update data
 */
export function validateMemberData(data: {
  full_name?: string;
  phone?: string;
  branch?: string;
}): { isValid: boolean; errors: MemberValidationErrors; normalized?: { phone?: string } } {
  const errors: MemberValidationErrors = {};

  // Validate full name
  if (!data.full_name || data.full_name.trim().length === 0) {
    errors.full_name = 'Full name is required';
  } else if (data.full_name.trim().length < 2) {
    errors.full_name = 'Full name must be at least 2 characters';
  } else if (data.full_name.trim().length > 100) {
    errors.full_name = 'Full name must be less than 100 characters';
  }

  // Validate phone
  if (!data.phone || data.phone.trim().length === 0) {
    errors.phone = 'Phone number is required';
  } else {
    try {
      const normalized = validateAndNormalizePhone(data.phone);
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        normalized: { phone: normalized }
      };
    } catch (err) {
      errors.phone = err instanceof Error ? err.message : 'Invalid phone number format';
    }
  }

  // Validate branch (optional but if provided, should not be empty)
  if (data.branch && data.branch.trim().length === 0) {
    errors.branch = 'Branch cannot be empty if provided';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

