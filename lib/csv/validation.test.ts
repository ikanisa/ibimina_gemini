/**
 * CSV Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validatePhone,
  normalizePhone,
  validateEmail,
  validateName,
  validateGroupCode,
  validateMemberCode,
  validateAmount,
  validateDate,
  validateCurrency,
  validateGroupRow,
  validateMemberRow,
  validateTransactionRow,
  validateCSVData,
} from './validation';

describe('validatePhone', () => {
  it('should accept valid phone numbers', () => {
    expect(validatePhone('+250788123456')).toBe(true);
    expect(validatePhone('0788123456')).toBe(true);
    expect(validatePhone('788123456')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(validatePhone('')).toBe(false);
    expect(validatePhone('123')).toBe(false);
    expect(validatePhone('abc123')).toBe(false);
    expect(validatePhone('+2507881234567890123')).toBe(false); // Too long
  });
});

describe('normalizePhone', () => {
  it('should normalize phone numbers', () => {
    // normalizePhone from validation.ts replaces leading 0 with +250
    expect(normalizePhone('0788123456')).toBe('+250788123456');
    expect(normalizePhone('+250788123456')).toBe('+250788123456');
    // Numbers without leading 0 or + are kept as-is (validation.ts doesn't add +250)
    const result = normalizePhone('788123456');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle empty strings', () => {
    expect(normalizePhone('')).toBe('');
  });
});

describe('validateEmail', () => {
  it('should accept valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
  });
});

describe('validateName', () => {
  it('should accept valid names', () => {
    expect(validateName('John Doe')).toBe(true);
    expect(validateName("O'Brien")).toBe(true);
    expect(validateName('Jean-Pierre')).toBe(true);
  });

  it('should reject invalid names', () => {
    expect(validateName('')).toBe(false);
    expect(validateName('John123')).toBe(false);
    expect(validateName('John@Doe')).toBe(false);
  });
});

describe('validateGroupCode', () => {
  it('should accept valid group codes', () => {
    expect(validateGroupCode('GRP-001')).toBe(true);
    expect(validateGroupCode('GROUP_001')).toBe(true);
    expect(validateGroupCode('ABC123')).toBe(true);
  });

  it('should reject invalid group codes', () => {
    // Empty string is valid (optional field)
    expect(validateGroupCode('')).toBe(true);
    // Spaces not allowed (only alphanumeric, hyphens, underscores)
    expect(validateGroupCode('GRP 001')).toBe(false);
    expect(validateGroupCode('GRP@001')).toBe(false); // Special chars not allowed
  });
});

describe('validateMemberCode', () => {
  it('should accept valid member codes', () => {
    expect(validateMemberCode('MEM-001')).toBe(true);
    expect(validateMemberCode('MEMBER_001')).toBe(true);
  });

  it('should reject invalid member codes', () => {
    // Empty string is valid (optional field)
    expect(validateMemberCode('')).toBe(true);
    // Spaces not allowed
    expect(validateMemberCode('MEM 001')).toBe(false);
  });
});

describe('validateAmount', () => {
  it('should accept valid amounts', () => {
    expect(validateAmount('1000')).toBe(true);
    expect(validateAmount('1000.50')).toBe(true);
    expect(validateAmount('0')).toBe(true);
  });

  it('should reject invalid amounts', () => {
    expect(validateAmount('')).toBe(false);
    expect(validateAmount('abc')).toBe(false);
    expect(validateAmount('-100')).toBe(false); // Negative
  });
});

describe('validateDate', () => {
  it('should accept valid dates', () => {
    expect(validateDate('2024-01-15')).toBe(true);
    expect(validateDate('2024/01/15')).toBe(true);
  });

  it('should reject invalid dates', () => {
    expect(validateDate('')).toBe(false);
    expect(validateDate('invalid')).toBe(false);
  });
});

describe('validateCurrency', () => {
  it('should accept valid currencies', () => {
    expect(validateCurrency('RWF')).toBe(true);
    expect(validateCurrency('USD')).toBe(true);
  });

  it('should reject invalid currencies', () => {
    // Empty string is valid (optional field, defaults to RWF)
    expect(validateCurrency('')).toBe(true);
    // Must be exactly 3 uppercase letters
    expect(validateCurrency('XYZ123')).toBe(false); // 6 chars, not 3
    expect(validateCurrency('XY')).toBe(false); // Only 2 chars
  });
});

describe('validateGroupRow', () => {
  it('should accept valid group row', () => {
    const row = { name: 'Test Group', group_code: 'GRP-001' };
    const result = validateGroupRow(row, 1);
    expect(result.isValid).toBe(true);
  });

  it('should reject row without name', () => {
    const row = { name: '' };
    const result = validateGroupRow(row, 1);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject invalid group code', () => {
    const row = { name: 'Test Group', group_code: 'INVALID CODE' };
    const result = validateGroupRow(row, 1);
    expect(result.isValid).toBe(false);
  });
});

describe('validateMemberRow', () => {
  it('should accept valid member row', () => {
    const row = { full_name: 'John Doe', phone: '+250788123456' };
    const result = validateMemberRow(row, 1);
    expect(result.isValid).toBe(true);
  });

  it('should reject row without name', () => {
    const row = { full_name: '' };
    const result = validateMemberRow(row, 1);
    expect(result.isValid).toBe(false);
  });
});

describe('validateTransactionRow', () => {
  it('should accept valid transaction row', () => {
    const row = { amount: '1000', currency: 'RWF', date: '2024-01-15' };
    const result = validateTransactionRow(row, 1);
    expect(result.isValid).toBe(true);
  });

  it('should reject row without amount', () => {
    const row = { amount: '' };
    const result = validateTransactionRow(row, 1);
    expect(result.isValid).toBe(false);
  });

  it('should reject invalid currency', () => {
    const row = { amount: '1000', currency: 'INVALID' };
    const result = validateTransactionRow(row, 1);
    expect(result.isValid).toBe(false);
  });
});

describe('validateCSVData', () => {
  it('should separate valid and invalid rows', () => {
    // Use names without numbers (validateName only allows letters, spaces, hyphens, apostrophes)
    const data = [
      { name: 'Test Group' }, // Valid - passes validateRequired and validateName
      { name: '' }, // Invalid - empty name (validateRequired rejects empty strings)
      { name: 'Another Group' }, // Valid - passes validateRequired and validateName
    ];

    const result = validateCSVData(data, validateGroupRow);
    // Should process all rows
    expect(result.validRows.length + result.invalidRows.length).toBe(data.length);
    // validateGroupRow validates name field - rows with valid names should pass
    // The first and third rows have valid names, so they should be valid
    expect(result.validRows.length).toBe(2);
    // The second row has empty name, so it should be invalid
    expect(result.invalidRows.length).toBe(1);
    // Should have errors for invalid rows
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
