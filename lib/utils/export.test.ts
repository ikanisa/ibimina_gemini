/**
 * Export Utilities Tests
 * Unit tests for CSV export functionality
 */

import { describe, it, expect } from 'vitest';
import {
    objectsToCsv,
    formatTransactionsForExport,
    formatMembersForExport,
} from './export';

describe('objectsToCsv', () => {
    it('should convert array of objects to CSV string', () => {
        const data = [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25 },
        ];

        const result = objectsToCsv(data);

        expect(result).toContain('name,age');
        expect(result).toContain('John,30');
        expect(result).toContain('Jane,25');
    });

    it('should handle empty array', () => {
        const result = objectsToCsv([]);
        expect(result).toBe('');
    });

    it('should escape values with commas', () => {
        const data = [
            { name: 'Doe, John', city: 'New York' },
        ];

        const result = objectsToCsv(data);

        expect(result).toContain('"Doe, John"');
    });

    it('should escape values with quotes', () => {
        const data = [
            { name: 'John "Johnny" Doe', city: 'NYC' },
        ];

        const result = objectsToCsv(data);

        expect(result).toContain('"John ""Johnny"" Doe"');
    });

    it('should handle null and undefined values', () => {
        const data = [
            { name: 'John', email: null, phone: undefined },
        ];

        const result = objectsToCsv(data as any);

        expect(result).toContain('John,,');
    });

    it('should use custom delimiter', () => {
        const data = [
            { name: 'John', age: 30 },
        ];

        const result = objectsToCsv(data, { delimiter: ';' });

        expect(result).toContain('name;age');
        expect(result).toContain('John;30');
    });

    it('should skip headers when includeHeaders is false', () => {
        const data = [
            { name: 'John', age: 30 },
        ];

        const result = objectsToCsv(data, { includeHeaders: false });

        expect(result).not.toContain('name,age');
        expect(result).toBe('John,30');
    });
});

describe('formatTransactionsForExport', () => {
    it('should format transactions correctly', () => {
        const transactions = [
            {
                id: 'txn-123',
                created_at: '2026-01-15T10:30:00Z',
                occurred_at: '2026-01-15T10:30:00Z',
                momo_ref: 'REF123',
                transaction_type: 'DEPOSIT',
                member_name: 'John Doe',
                payer_name: null,
                group_name: 'Savings A',
                amount: 50000,
                currency: 'RWF',
                channel: 'MOMO_NFC',
                transaction_status: 'COMPLETED',
            },
        ];

        const result = formatTransactionsForExport(transactions);

        expect(result).toHaveLength(1);
        expect(result[0].Reference).toBe('REF123');
        expect(result[0].Type).toBe('DEPOSIT');
        expect(result[0].Member).toBe('John Doe');
        expect(result[0].Group).toBe('Savings A');
        expect(result[0].Currency).toBe('RWF');
        expect(result[0].Status).toBe('COMPLETED');
    });

    it('should handle missing optional fields', () => {
        const transactions = [
            {
                id: 'txn-456',
                created_at: '2026-01-15T10:30:00Z',
                amount: 10000,
                currency: 'RWF',
                channel: 'CASH',
            },
        ];

        const result = formatTransactionsForExport(transactions as any);

        expect(result[0].Reference).toBe('txn-456');
        expect(result[0].Member).toBe('N/A');
        expect(result[0].Group).toBe('N/A');
        expect(result[0].Type).toBe('Unknown');
    });
});

describe('formatMembersForExport', () => {
    it('should format members correctly', () => {
        const members = [
            {
                full_name: 'Jane Smith',
                phone: '+250788111222',
                branch: 'Main',
                status: 'ACTIVE',
                kyc_status: 'VERIFIED',
                savings_balance: 150000,
                loan_balance: 0,
                created_at: '2026-01-01T00:00:00Z',
            },
        ];

        const result = formatMembersForExport(members);

        expect(result).toHaveLength(1);
        expect(result[0].Name).toBe('Jane Smith');
        expect(result[0].Phone).toBe('+250788111222');
        expect(result[0].Branch).toBe('Main');
        expect(result[0].Status).toBe('ACTIVE');
        expect(result[0].KYC_Status).toBe('VERIFIED');
    });

    it('should handle null optional fields', () => {
        const members = [
            {
                full_name: 'Test User',
                phone: '+250788000000',
                branch: null,
                status: 'ACTIVE',
                kyc_status: undefined,
                savings_balance: null,
                loan_balance: null,
                created_at: '2026-01-01T00:00:00Z',
            },
        ];

        const result = formatMembersForExport(members as any);

        expect(result[0].Branch).toBe('N/A');
        expect(result[0].KYC_Status).toBe('Pending');
    });
});
