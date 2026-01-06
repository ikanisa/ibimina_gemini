/**
 * Error Handler Tests
 */

import { describe, it, expect } from 'vitest';
import { handleSupabaseError, getUserFriendlyError, ApiError } from './errorHandler';

describe('handleSupabaseError', () => {
    it('should handle ApiError instances', () => {
        const error = new ApiError('Test error', 'TEST_CODE', 400);
        const result = handleSupabaseError(error);

        expect(result.message).toBe('Test error');
        expect(result.code).toBe('TEST_CODE');
        expect(result.statusCode).toBe(400);
    });

    it('should map PGRST116 to not found message', () => {
        const error = { message: 'Row not found', code: 'PGRST116' };
        const result = handleSupabaseError(error);

        expect(result.message).toBe('The requested record was not found.');
        expect(result.code).toBe('PGRST116');
    });

    it('should map 23505 to duplicate error message', () => {
        const error = { message: 'Duplicate key', code: '23505' };
        const result = handleSupabaseError(error);

        expect(result.message).toBe('This record already exists.');
    });

    it('should map 23503 to foreign key error message', () => {
        const error = { message: 'FK violation', code: '23503' };
        const result = handleSupabaseError(error);

        expect(result.message).toBe('Cannot delete this record because it is referenced by other records.');
    });

    it('should map 42501 to permission error message', () => {
        const error = { message: 'Permission denied', code: '42501' };
        const result = handleSupabaseError(error);

        expect(result.message).toBe('You do not have permission to perform this action.');
    });

    it('should return original message for unknown error codes', () => {
        const error = { message: 'Something went wrong', code: 'UNKNOWN_CODE' };
        const result = handleSupabaseError(error);

        expect(result.message).toBe('Something went wrong');
    });

    it('should handle Error instances', () => {
        const error = new Error('Standard error');
        const result = handleSupabaseError(error);

        expect(result.message).toBe('Standard error');
        expect(result.originalError).toBe(error);
    });

    it('should handle unknown error types', () => {
        const result = handleSupabaseError('string error');

        expect(result.message).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle null/undefined', () => {
        const result = handleSupabaseError(null);

        expect(result.message).toBe('An unexpected error occurred. Please try again.');
    });
});

describe('getUserFriendlyError', () => {
    it('should return user-friendly message', () => {
        const error = { message: 'Row not found', code: 'PGRST116' };
        const message = getUserFriendlyError(error);

        expect(message).toBe('The requested record was not found.');
    });

    it('should return generic message for unknown errors', () => {
        const message = getUserFriendlyError(undefined);

        expect(message).toBe('An unexpected error occurred. Please try again.');
    });
});

describe('ApiError', () => {
    it('should create ApiError with all properties', () => {
        const originalError = new Error('Original');
        const error = new ApiError('API error', 'API_001', 500, originalError);

        expect(error.message).toBe('API error');
        expect(error.code).toBe('API_001');
        expect(error.statusCode).toBe(500);
        expect(error.originalError).toBe(originalError);
        expect(error.name).toBe('ApiError');
    });

    it('should be an instance of Error', () => {
        const error = new ApiError('Test');
        expect(error).toBeInstanceOf(Error);
    });
});
