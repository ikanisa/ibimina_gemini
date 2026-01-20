/**
 * Validation Schema Tests
 * Unit tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
    passwordSchema,
    loginSchema,
    emailSchema,
    phoneSchema,
    memberCreateSchema,
    groupCreateSchema,
    transactionCreateSchema,
} from './schemas';

describe('passwordSchema', () => {
    it('should reject passwords shorter than 12 characters', () => {
        const result = passwordSchema.safeParse('Short1!');
        expect(result.success).toBe(false);
    });

    it('should reject passwords without uppercase letters', () => {
        const result = passwordSchema.safeParse('lowercaseonly123!');
        expect(result.success).toBe(false);
    });

    it('should reject passwords without lowercase letters', () => {
        const result = passwordSchema.safeParse('UPPERCASEONLY123!');
        expect(result.success).toBe(false);
    });

    it('should reject passwords without numbers', () => {
        const result = passwordSchema.safeParse('NoNumbersHere!@');
        expect(result.success).toBe(false);
    });

    it('should reject passwords without special characters', () => {
        const result = passwordSchema.safeParse('NoSpecialChars123');
        expect(result.success).toBe(false);
    });

    it('should accept valid strong passwords', () => {
        const result = passwordSchema.safeParse('StrongPass123!@');
        expect(result.success).toBe(true);
    });
});

describe('emailSchema', () => {
    it('should accept valid email addresses', () => {
        const validEmails = [
            'test@example.com',
            'user.name@domain.org',
            'user+tag@example.co.uk',
        ];

        validEmails.forEach((email) => {
            const result = emailSchema.safeParse(email);
            expect(result.success).toBe(true);
        });
    });

    it('should reject invalid email addresses', () => {
        const invalidEmails = [
            'notanemail',
            '@nodomain.com',
            'noat.com',
            'spaces in@email.com',
        ];

        invalidEmails.forEach((email) => {
            const result = emailSchema.safeParse(email);
            expect(result.success).toBe(false);
        });
    });
});

describe('phoneSchema', () => {
    it('should accept valid phone numbers', () => {
        const validPhones = [
            '+250788123456',
            '0788123456',
            '+1234567890',
        ];

        validPhones.forEach((phone) => {
            const result = phoneSchema.safeParse(phone);
            expect(result.success).toBe(true);
        });
    });

    it('should reject phone numbers that are too short', () => {
        const result = phoneSchema.safeParse('12345');
        expect(result.success).toBe(false);
    });

    it('should reject phone numbers with invalid characters', () => {
        const result = phoneSchema.safeParse('+123-456-7890');
        expect(result.success).toBe(false);
    });
});

describe('loginSchema', () => {
    it('should accept valid login credentials', () => {
        const result = loginSchema.safeParse({
            email: 'user@example.com',
            password: 'anypassword',
        });
        expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
        const result = loginSchema.safeParse({
            email: 'user@example.com',
            password: '',
        });
        expect(result.success).toBe(false);
    });
});

describe('memberCreateSchema', () => {
    it('should accept valid member data', () => {
        const result = memberCreateSchema.safeParse({
            fullName: 'John Doe',
            phone: '+250788123456',
            institutionId: '123e4567-e89b-12d3-a456-426614174000',
        });
        expect(result.success).toBe(true);
    });

    it('should reject member with short name', () => {
        const result = memberCreateSchema.safeParse({
            fullName: 'J',
            phone: '+250788123456',
            institutionId: '123e4567-e89b-12d3-a456-426614174000',
        });
        expect(result.success).toBe(false);
    });

    it('should reject member with invalid institution ID', () => {
        const result = memberCreateSchema.safeParse({
            fullName: 'John Doe',
            phone: '+250788123456',
            institutionId: 'not-a-uuid',
        });
        expect(result.success).toBe(false);
    });
});

describe('groupCreateSchema', () => {
    it('should accept valid group data', () => {
        const result = groupCreateSchema.safeParse({
            groupName: 'Test Group',
            institutionId: '123e4567-e89b-12d3-a456-426614174000',
            expectedAmount: 5000,
            frequency: 'WEEKLY',
        });
        expect(result.success).toBe(true);
    });

    it('should reject group with negative amount', () => {
        const result = groupCreateSchema.safeParse({
            groupName: 'Test Group',
            institutionId: '123e4567-e89b-12d3-a456-426614174000',
            expectedAmount: -100,
            frequency: 'WEEKLY',
        });
        expect(result.success).toBe(false);
    });

    it('should reject group with invalid frequency', () => {
        const result = groupCreateSchema.safeParse({
            groupName: 'Test Group',
            institutionId: '123e4567-e89b-12d3-a456-426614174000',
            expectedAmount: 5000,
            frequency: 'DAILY', // Not a valid option
        });
        expect(result.success).toBe(false);
    });
});

describe('transactionCreateSchema', () => {
    it('should accept valid transaction data', () => {
        const result = transactionCreateSchema.safeParse({
            institutionId: '123e4567-e89b-12d3-a456-426614174000',
            amount: 10000,
            type: 'DEPOSIT',
            channel: 'MOMO_USSD',
        });
        expect(result.success).toBe(true);
    });

    it('should reject transaction with zero amount', () => {
        const result = transactionCreateSchema.safeParse({
            institutionId: '123e4567-e89b-12d3-a456-426614174000',
            amount: 0,
            type: 'DEPOSIT',
            channel: 'CASH',
        });
        expect(result.success).toBe(false);
    });

    it('should reject transaction exceeding maximum limit', () => {
        const result = transactionCreateSchema.safeParse({
            institutionId: '123e4567-e89b-12d3-a456-426614174000',
            amount: 999999999, // Exceeds 100,000,000 limit
            type: 'DEPOSIT',
            channel: 'CASH',
        });
        expect(result.success).toBe(false);
    });

    it('should reject transaction with invalid type', () => {
        const result = transactionCreateSchema.safeParse({
            institutionId: '123e4567-e89b-12d3-a456-426614174000',
            amount: 10000,
            type: 'INVALID_TYPE',
            channel: 'CASH',
        });
        expect(result.success).toBe(false);
    });
});
