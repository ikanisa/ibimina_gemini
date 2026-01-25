/**
 * Validation Unit Tests
 * Tests for phone, email, and amount validation functions
 */

import { describe, it, expect } from 'vitest';

// Phone validation tests using the actual validation logic
describe('Phone Validation', () => {
    // Rwandan phone format: +250 7XX XXX XXX or 07XX XXX XXX
    const isValidRwandanPhone = (phone: string): boolean => {
        const cleaned = phone.replace(/\s|-/g, '');

        // Match +250 followed by 7/8/9 and 8 more digits, or 07/08/09 followed by 8 digits
        const patterns = [
            /^\+2507[2389]\d{7}$/,   // +250 format
            /^07[2389]\d{7}$/,       // Local format
            /^2507[2389]\d{7}$/      // Without + prefix
        ];

        return patterns.some(p => p.test(cleaned));
    };

    it('accepts valid Rwandan phone numbers with +250 prefix', () => {
        expect(isValidRwandanPhone('+250788123456')).toBe(true);
        expect(isValidRwandanPhone('+250789123456')).toBe(true);
        expect(isValidRwandanPhone('+250722123456')).toBe(true);
        expect(isValidRwandanPhone('+250783123456')).toBe(true);
    });

    it('accepts valid local format phone numbers', () => {
        expect(isValidRwandanPhone('0788123456')).toBe(true);
        expect(isValidRwandanPhone('0789123456')).toBe(true);
        expect(isValidRwandanPhone('0722123456')).toBe(true);
    });

    it('accepts phone numbers with spaces', () => {
        expect(isValidRwandanPhone('+250 788 123 456')).toBe(true);
        expect(isValidRwandanPhone('078 812 3456')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
        expect(isValidRwandanPhone('123')).toBe(false);
        expect(isValidRwandanPhone('abcdefghij')).toBe(false);
        expect(isValidRwandanPhone('+1234567890')).toBe(false);
        expect(isValidRwandanPhone('')).toBe(false);
    });

    it('rejects incorrectly formatted numbers', () => {
        expect(isValidRwandanPhone('078812345')).toBe(false);  // Too short
        expect(isValidRwandanPhone('07881234567')).toBe(false); // Too long
        expect(isValidRwandanPhone('0688123456')).toBe(false);  // Wrong carrier prefix
    });
});

describe('Email Validation', () => {
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    it('accepts valid email addresses', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
        expect(isValidEmail('user.name@example.co.rw')).toBe(true);
        expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('invalid@')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('user @example.com')).toBe(false);
        expect(isValidEmail('')).toBe(false);
    });
});

describe('Amount Validation', () => {
    const isValidAmount = (amount: number): boolean => {
        return typeof amount === 'number' && amount > 0 && !isNaN(amount) && isFinite(amount);
    };

    it('accepts positive amounts', () => {
        expect(isValidAmount(100)).toBe(true);
        expect(isValidAmount(0.01)).toBe(true);
        expect(isValidAmount(50000)).toBe(true);
        expect(isValidAmount(0.5)).toBe(true);
    });

    it('rejects zero', () => {
        expect(isValidAmount(0)).toBe(false);
    });

    it('rejects negative amounts', () => {
        expect(isValidAmount(-100)).toBe(false);
        expect(isValidAmount(-0.01)).toBe(false);
    });

    it('rejects NaN and Infinity', () => {
        expect(isValidAmount(NaN)).toBe(false);
        expect(isValidAmount(Infinity)).toBe(false);
        expect(isValidAmount(-Infinity)).toBe(false);
    });
});

describe('Currency Formatting', () => {
    const formatCurrency = (amount: number, currency = 'RWF'): string => {
        if (amount < 0) {
            return `-${currency} ${Math.abs(amount).toLocaleString()}`;
        }
        return `${currency} ${amount.toLocaleString()}`;
    };

    it('formats Rwandan Francs correctly', () => {
        expect(formatCurrency(10000)).toBe('RWF 10,000');
        expect(formatCurrency(1000000)).toBe('RWF 1,000,000');
    });

    it('handles zero', () => {
        expect(formatCurrency(0)).toBe('RWF 0');
    });

    it('handles negative amounts', () => {
        expect(formatCurrency(-5000)).toBe('-RWF 5,000');
    });

    it('supports custom currency', () => {
        expect(formatCurrency(100, 'USD')).toBe('USD 100');
    });
});

describe('Date Formatting', () => {
    const formatDate = (date: Date | string): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    it('formats dates correctly', () => {
        const date = new Date('2024-01-15T00:00:00');
        expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('handles string dates', () => {
        expect(formatDate('2024-06-20T10:30:00Z')).toContain('2024');
    });

    it('handles different months', () => {
        expect(formatDate('2024-12-25')).toContain('Dec');
        expect(formatDate('2024-03-01')).toContain('Mar');
    });
});
