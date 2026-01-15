/**
 * Group Validation Tests
 */

import { describe, it, expect } from 'vitest';
import { validateGroupData } from './groupValidation';

describe('validateGroupData', () => {
    describe('group_name validation', () => {
        it('should require group name', () => {
            const result = validateGroupData({});
            expect(result.isValid).toBe(false);
            expect(result.errors.group_name).toBe('Group name is required');
        });

        it('should reject empty group name', () => {
            const result = validateGroupData({ group_name: '   ' });
            expect(result.isValid).toBe(false);
            expect(result.errors.group_name).toBe('Group name is required');
        });

        it('should reject group name less than 2 characters', () => {
            const result = validateGroupData({ group_name: 'A' });
            expect(result.isValid).toBe(false);
            expect(result.errors.group_name).toBe('Group name must be at least 2 characters');
        });

        it('should reject group name over 100 characters', () => {
            const result = validateGroupData({ group_name: 'A'.repeat(101) });
            expect(result.isValid).toBe(false);
            expect(result.errors.group_name).toBe('Group name must be less than 100 characters');
        });

        it('should accept valid group name', () => {
            const result = validateGroupData({
                group_name: 'Ibimina ya Gasabo',
                expected_amount: 5000
            });
            expect(result.errors.group_name).toBeUndefined();
        });
    });

    describe('expected_amount validation', () => {
        it('should require expected amount', () => {
            const result = validateGroupData({ group_name: 'Test Group' });
            expect(result.isValid).toBe(false);
            expect(result.errors.expected_amount).toBe('Expected contribution amount is required');
        });

        it('should reject negative amounts', () => {
            const result = validateGroupData({
                group_name: 'Test Group',
                expected_amount: -100
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.expected_amount).toBe('Expected amount cannot be negative');
        });

        it('should reject amounts over 100 million', () => {
            const result = validateGroupData({
                group_name: 'Test Group',
                expected_amount: 100000001
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.expected_amount).toBe('Expected amount is too large');
        });

        it('should accept valid amount', () => {
            const result = validateGroupData({
                group_name: 'Test Group',
                expected_amount: 5000
            });
            expect(result.errors.expected_amount).toBeUndefined();
        });

        it('should accept zero amount', () => {
            const result = validateGroupData({
                group_name: 'Test Group',
                expected_amount: 0
            });
            expect(result.errors.expected_amount).toBeUndefined();
        });
    });

    describe('frequency validation', () => {
        it('should accept Weekly frequency', () => {
            const result = validateGroupData({
                group_name: 'Test',
                expected_amount: 1000,
                frequency: 'Weekly'
            });
            expect(result.errors.frequency).toBeUndefined();
        });

        it('should accept Monthly frequency', () => {
            const result = validateGroupData({
                group_name: 'Test',
                expected_amount: 1000,
                frequency: 'Monthly'
            });
            expect(result.errors.frequency).toBeUndefined();
        });

        it('should reject invalid frequency', () => {
            const result = validateGroupData({
                group_name: 'Test',
                expected_amount: 1000,
                frequency: 'Daily'
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.frequency).toBe('Frequency must be either "Weekly" or "Monthly"');
        });
    });

    describe('contribution day validation', () => {
        it('should accept valid contribution days', () => {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            days.forEach(day => {
                const result = validateGroupData({
                    group_name: 'Test',
                    expected_amount: 1000,
                    meeting_day: day
                });
                expect(result.errors.meeting_day).toBeUndefined();
            });
        });

        it('should reject invalid contribution day', () => {
            const result = validateGroupData({
                group_name: 'Test',
                expected_amount: 1000,
                meeting_day: 'Funday'
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.meeting_day).toContain('Contribution day must be one of');
        });
    });

    describe('complete validation', () => {
        it('should pass with all valid fields', () => {
            const result = validateGroupData({
                group_name: 'Ibimina ya Gasabo',
                expected_amount: 5000,
                frequency: 'Weekly',
                meeting_day: 'Friday'
            });
            expect(result.isValid).toBe(true);
            expect(Object.keys(result.errors)).toHaveLength(0);
        });
    });
});
