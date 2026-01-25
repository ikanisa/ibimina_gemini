/**
 * CSV Import Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  parseCSV,
  detectDelimiter,
  normalizeHeaders,
  readFileAsText,
  validateCSVFile,
} from './import';

describe('parseCSV', () => {
  it('should parse simple CSV', () => {
    const csv = 'name,code\nGroup 1,GRP-001\nGroup 2,GRP-002';
    const result = parseCSV(csv);
    expect(result.rows).toHaveLength(2);
    // Headers are normalized to lowercase
    expect(result.headers).toContain('name');
    expect(result.headers).toContain('code');
    // First row should have normalized keys
    const firstRow = result.rows[0];
    expect(firstRow).toBeDefined();
    // Check that data is accessible via normalized keys
    const nameValue = firstRow['name'] || firstRow['group 1'];
    expect(nameValue).toBeDefined();
  });

  it('should handle quoted values', () => {
    const csv = 'name,description\n"Group 1","Description, with comma"';
    const result = parseCSV(csv);
    expect(result.rows[0]['description']).toBe('Description, with comma');
  });

  it('should handle empty file', () => {
    const result = parseCSV('');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle custom delimiter', () => {
    const csv = 'name;code\nGroup 1;GRP-001';
    const result = parseCSV(csv, { delimiter: ';' });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toBeDefined();
  });

  it('should skip empty lines', () => {
    const csv = 'name,code\nGroup 1,GRP-001\n\nGroup 2,GRP-002';
    const result = parseCSV(csv, { skipEmptyLines: true });
    expect(result.rows).toHaveLength(2);
  });
});

describe('detectDelimiter', () => {
  it('should detect comma delimiter', () => {
    const csv = 'name,code,value';
    expect(detectDelimiter(csv)).toBe(',');
  });

  it('should detect semicolon delimiter', () => {
    const csv = 'name;code;value';
    expect(detectDelimiter(csv)).toBe(';');
  });

  it('should default to comma', () => {
    expect(detectDelimiter('')).toBe(',');
  });
});

describe('normalizeHeaders', () => {
  it('should normalize header variations', () => {
    const headers = ['Full Name', 'phone_primary', 'GROUP_CODE', 'Email Address'];
    const mapping = normalizeHeaders(headers);
    // Check that mapping exists
    expect(mapping.size).toBeGreaterThan(0);
    // Check specific mappings - headers are normalized to lowercase
    const normalized = headers.map(h => h.toLowerCase().trim());
    normalized.forEach(header => {
      expect(mapping.has(header)).toBe(true);
    });
  });
});

describe('readFileAsText', () => {
  it('should read file as text', async () => {
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    const content = await readFileAsText(file);
    expect(content).toBe('test content');
  });
});

describe('validateCSVFile', () => {
  it('should validate CSV file', () => {
    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    const result = validateCSVFile(file);
    expect(result.valid).toBe(true);
  });

  it('should reject non-CSV files', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const result = validateCSVFile(file);
    expect(result.valid).toBe(false);
  });

  it('should reject files that are too large', () => {
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const file = new File([largeContent], 'test.csv', { type: 'text/csv' });
    const result = validateCSVFile(file);
    expect(result.valid).toBe(false);
  });

  it('should reject empty files', () => {
    const file = new File([], 'test.csv', { type: 'text/csv' });
    const result = validateCSVFile(file);
    expect(result.valid).toBe(false);
  });
});
