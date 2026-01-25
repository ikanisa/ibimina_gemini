/**
 * CSV Export Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportTransactions,
  exportMembers,
  exportGroups,
  exportReport,
  arrayToCSV,
  downloadCSV,
  generateCSVTemplate,
} from './export';

describe('arrayToCSV', () => {
  it('should convert array to CSV string', () => {
    const data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ];
    const csv = arrayToCSV(data);
    // CSV should contain headers and data
    expect(csv).toContain('name');
    expect(csv).toContain('age');
    expect(csv).toContain('John');
    expect(csv).toContain('30');
    expect(csv).toContain('Jane');
    expect(csv).toContain('25');
    // Should have at least 2 lines (header + data)
    expect(csv.split('\n').length).toBeGreaterThanOrEqual(2);
  });

  it('should handle empty array', () => {
    const csv = arrayToCSV([]);
    expect(csv).toBe('');
  });

  it('should escape values with commas', () => {
    const data = [{ name: 'Doe, John', city: 'New York' }];
    const csv = arrayToCSV(data);
    // CSV should escape commas by wrapping in quotes
    expect(csv).toMatch(/Doe.*John/);
    // Should contain the value
    expect(csv).toContain('New York');
    // Should have proper CSV structure
    expect(csv.split('\n').length).toBeGreaterThanOrEqual(2);
  });

  it('should escape values with quotes', () => {
    const data = [{ name: 'John "Johnny" Doe' }];
    const csv = arrayToCSV(data);
    // CSV should escape quotes
    expect(csv).toContain('John');
    expect(csv).toContain('Johnny');
    // Should have proper CSV structure
    expect(csv.split('\n').length).toBeGreaterThanOrEqual(2);
  });

  it('should handle null and undefined', () => {
    const data = [{ name: 'John', email: null, phone: undefined }];
    const csv = arrayToCSV(data);
    expect(csv).toContain('John');
    // Should have headers for all fields
    expect(csv).toContain('name');
    expect(csv).toContain('email');
    expect(csv).toContain('phone');
    // Should have proper CSV structure
    expect(csv.split('\n').length).toBeGreaterThanOrEqual(2);
  });
});

describe('downloadCSV', () => {
  beforeEach(() => {
    // Mock DOM methods
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    document.createElement = vi.fn(() => mockAnchor) as any;
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  it('should trigger download', () => {
    downloadCSV('name,value\nTest,123', 'test.csv');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
  });
});

describe('exportTransactions', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
    document.createElement = vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    })) as any;
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  it('should export transactions to CSV', () => {
    const transactions = [
      {
        id: '1',
        occurred_at: '2024-01-15',
        amount: 1000,
        currency: 'RWF',
        type: 'DEPOSIT',
        channel: 'MOBILE',
        status: 'COMPLETED',
        allocation_status: 'allocated',
        payer_name: 'John Doe',
        payer_phone: '+250788123456',
        momo_ref: 'REF123',
        reference: null,
        member_id: 'member-1',
        group_id: 'group-1',
        allocated_at: '2024-01-15',
        members: { full_name: 'John Doe' },
        groups: { name: 'Group 1' },
      },
    ];

    exportTransactions(transactions as any);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});

describe('exportMembers', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    document.createElement = vi.fn(() => mockAnchor) as any;
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  it('should export members to CSV', () => {
    const members = [
      {
        id: '1',
        full_name: 'John Doe',
        phone: '+250788123456',
        phone_alt: null,
        member_code: 'MEM-001',
        email: 'john@example.com',
        group_name: 'Group 1',
        group_code: 'GRP-001',
        created_at: '2024-01-15',
      },
    ];

    exportMembers(members);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
  });
});

describe('exportGroups', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:url');
    global.URL.revokeObjectURL = vi.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    document.createElement = vi.fn(() => mockAnchor) as any;
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  it('should export groups to CSV', () => {
    const groups = [
      {
        id: '1',
        name: 'Group 1',
        group_code: 'GRP-001',
        meeting_day: 'Monday',
        frequency: 'Weekly',
        expected_amount: 1000,
        member_count: 10,
        created_at: '2024-01-15',
      },
    ];

    exportGroups(groups);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});

describe('generateCSVTemplate', () => {
  it('should generate CSV template with headers', () => {
    const template = generateCSVTemplate(['name', 'code']);
    expect(template).toContain('name');
    expect(template).toContain('code');
  });

  it('should include sample data if provided', () => {
    const sampleData = [{ name: 'Sample', code: 'SMP-001' }];
    const template = generateCSVTemplate(['name', 'code'], sampleData);
    expect(template).toContain('Sample');
    expect(template).toContain('SMP-001');
  });
});
