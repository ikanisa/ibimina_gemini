/**
 * CSV Validation Utilities
 * Provides comprehensive validation for CSV import data
 */

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  value?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates phone number format (supports international formats)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Check for international format (+ followed by digits) or local format (digits only)
  return /^\+?[0-9]{8,15}$/.test(cleaned);
}

/**
 * Normalizes phone number to standard format
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^0/, '+250');
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates required field
 */
export function validateRequired(value: string | undefined | null): boolean {
  return value !== undefined && value !== null && value.trim().length > 0;
}

/**
 * Validates name (allows letters, spaces, hyphens, apostrophes)
 */
export function validateName(name: string): boolean {
  if (!name) return false;
  // Allow letters, spaces, hyphens, apostrophes, and common diacritics
  return /^[a-zA-Z\s\-\'À-ÿ]+$/.test(name.trim()) && name.trim().length >= 2;
}

/**
 * Validates group code format
 */
export function validateGroupCode(code: string): boolean {
  if (!code) return true; // Optional field
  // Allow alphanumeric with hyphens/underscores
  return /^[A-Za-z0-9\-_]+$/.test(code);
}

/**
 * Validates member code format
 */
export function validateMemberCode(code: string): boolean {
  if (!code) return true; // Optional field
  return /^[A-Za-z0-9\-_]+$/.test(code);
}

/**
 * Validates amount (numeric, positive)
 */
export function validateAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num >= 0;
}

/**
 * Validates date format (ISO or common formats)
 */
export function validateDate(date: string): boolean {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Validates currency code (3-letter ISO)
 */
export function validateCurrency(currency: string): boolean {
  if (!currency) return true; // Optional, defaults to RWF
  return /^[A-Z]{3}$/.test(currency.toUpperCase());
}

/**
 * Validates CSV row for groups
 */
export function validateGroupRow(
  row: Record<string, string>,
  rowIndex: number,
  existingCodes: Set<string> = new Set()
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate required fields
  if (!validateRequired(row.name || row.group_name)) {
    errors.push({
      row: rowIndex,
      column: 'name',
      message: 'Group name is required',
    });
  } else if (!validateName(row.name || row.group_name)) {
    errors.push({
      row: rowIndex,
      column: 'name',
      message: 'Group name must contain only letters, spaces, hyphens, and apostrophes',
      value: row.name || row.group_name,
    });
  }

  // Validate optional group_code
  if (row.group_code) {
    if (!validateGroupCode(row.group_code)) {
      errors.push({
        row: rowIndex,
        column: 'group_code',
        message: 'Group code must be alphanumeric with hyphens or underscores',
        value: row.group_code,
      });
    } else if (existingCodes.has(row.group_code.toLowerCase())) {
      warnings.push({
        row: rowIndex,
        column: 'group_code',
        message: 'Group code already exists (will be skipped)',
        value: row.group_code,
      });
    }
  }

  // Validate optional fields
  if (row.expected_amount && !validateAmount(row.expected_amount)) {
    errors.push({
      row: rowIndex,
      column: 'expected_amount',
      message: 'Expected amount must be a positive number',
      value: row.expected_amount,
    });
  }

  if (row.frequency && !['Daily', 'Weekly', 'Monthly'].includes(row.frequency)) {
    errors.push({
      row: rowIndex,
      column: 'frequency',
      message: 'Frequency must be Daily, Weekly, or Monthly',
      value: row.frequency,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates CSV row for members
 */
export function validateMemberRow(
  row: Record<string, string>,
  rowIndex: number,
  existingPhones: Set<string> = new Set(),
  availableGroupCodes: Map<string, string> = new Map()
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate required fields
  if (!validateRequired(row.full_name || row.name)) {
    errors.push({
      row: rowIndex,
      column: 'full_name',
      message: 'Full name is required',
    });
  } else if (!validateName(row.full_name || row.name)) {
    errors.push({
      row: rowIndex,
      column: 'full_name',
      message: 'Full name must contain only letters, spaces, hyphens, and apostrophes',
      value: row.full_name || row.name,
    });
  }

  // Validate phone (if provided)
  if (row.phone || row.phone_primary) {
    const phone = normalizePhone(row.phone || row.phone_primary);
    if (!validatePhone(phone)) {
      errors.push({
        row: rowIndex,
        column: 'phone',
        message: 'Phone number is invalid (must be 8-15 digits, optionally with country code)',
        value: row.phone || row.phone_primary,
      });
    } else if (existingPhones.has(phone)) {
      warnings.push({
        row: rowIndex,
        column: 'phone',
        message: 'Phone number already exists (member will be skipped or updated)',
        value: phone,
      });
    }
  }

  // Validate optional phone_alt
  if (row.phone_alt) {
    const phoneAlt = normalizePhone(row.phone_alt);
    if (!validatePhone(phoneAlt)) {
      errors.push({
        row: rowIndex,
        column: 'phone_alt',
        message: 'Alternate phone number is invalid',
        value: row.phone_alt,
      });
    }
  }

  // Validate member_code
  if (row.member_code && !validateMemberCode(row.member_code)) {
    errors.push({
      row: rowIndex,
      column: 'member_code',
      message: 'Member code must be alphanumeric with hyphens or underscores',
      value: row.member_code,
    });
  }

  // Validate group_code/group_name
  if (row.group_code || row.group_name) {
    const groupCode = (row.group_code || row.group_name || '').toLowerCase();
    if (!availableGroupCodes.has(groupCode)) {
      errors.push({
        row: rowIndex,
        column: 'group_code',
        message: `Group "${row.group_code || row.group_name}" not found`,
        value: row.group_code || row.group_name,
      });
    }
  }

  // Validate email (if provided)
  if (row.email && !validateEmail(row.email)) {
    errors.push({
      row: rowIndex,
      column: 'email',
      message: 'Email address is invalid',
      value: row.email,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates CSV row for transactions
 */
export function validateTransactionRow(
  row: Record<string, string>,
  rowIndex: number
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate required fields
  if (!validateRequired(row.amount)) {
    errors.push({
      row: rowIndex,
      column: 'amount',
      message: 'Amount is required',
    });
  } else if (!validateAmount(row.amount)) {
    errors.push({
      row: rowIndex,
      column: 'amount',
      message: 'Amount must be a positive number',
      value: row.amount,
    });
  }

  if (!validateRequired(row.occurred_at || row.date)) {
    errors.push({
      row: rowIndex,
      column: 'occurred_at',
      message: 'Date is required',
    });
  } else if (!validateDate(row.occurred_at || row.date)) {
    errors.push({
      row: rowIndex,
      column: 'occurred_at',
      message: 'Date format is invalid (use YYYY-MM-DD or ISO format)',
      value: row.occurred_at || row.date,
    });
  }

  // Validate optional fields
  if (row.currency && !validateCurrency(row.currency)) {
    errors.push({
      row: rowIndex,
      column: 'currency',
      message: 'Currency must be a 3-letter ISO code (e.g., RWF, USD)',
      value: row.currency,
    });
  }

  if (row.payer_phone && !validatePhone(row.payer_phone)) {
    errors.push({
      row: rowIndex,
      column: 'payer_phone',
      message: 'Payer phone number is invalid',
      value: row.payer_phone,
    });
  }

  if (row.type && !['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].includes(row.type.toUpperCase())) {
    warnings.push({
      row: rowIndex,
      column: 'type',
      message: 'Transaction type should be DEPOSIT, WITHDRAWAL, or TRANSFER',
      value: row.type,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates entire CSV data array
 */
export function validateCSVData<T extends Record<string, string>>(
  data: T[],
  validator: (row: T, index: number, ...args: any[]) => ValidationResult,
  ...validatorArgs: any[]
): {
  validRows: T[];
  invalidRows: T[];
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const validRows: T[] = [];
  const invalidRows: T[] = [];
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  data.forEach((row, index) => {
    const result = validator(row, index + 2, ...validatorArgs); // +2 because row 1 is header, row index starts at 1
    if (result.isValid) {
      validRows.push(row);
    } else {
      invalidRows.push(row);
    }
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });

  return {
    validRows,
    invalidRows,
    errors: allErrors,
    warnings: allWarnings,
  };
}
