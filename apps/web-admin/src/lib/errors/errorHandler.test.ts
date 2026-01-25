/**
 * Error Handler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    handleError,
    getUserFriendlyMessage,
    AppError,
    TimeoutError,
    NetworkError,
    withTimeout,
    withRetry,
    createAppError
} from './index';

describe('AppError', () => {
    it('should create AppError with all properties', () => {
        const error = new AppError('Test error', 'TEST_CODE');
        expect(error.message).toBe('Test error');
        expect(error.code).toBe('TEST_CODE');
        expect(error).toBeInstanceOf(Error);
    });

    it('should be an instance of Error', () => {
        const error = new AppError('Test', 'CODE');
        expect(error).toBeInstanceOf(Error);
    });
});

describe('TimeoutError', () => {
    it('should create TimeoutError', () => {
        const error = new TimeoutError('test operation', 5000);
        expect(error.message).toBe('test operation timed out after 5000ms');
        expect(error.code).toBe('TIMEOUT');
        expect(error).toBeInstanceOf(AppError);
    });
});

describe('NetworkError', () => {
    it('should create NetworkError', () => {
        const error = new NetworkError('Network failed');
        expect(error.message).toBe('Network failed');
        expect(error.code).toBe('NETWORK_ERROR');
        expect(error).toBeInstanceOf(AppError);
    });

    it('should use default message if none provided', () => {
        const error = new NetworkError();
        expect(error.message).toBe('Network connection error. Please check your internet connection.');
    });
});

describe('handleError (via createAppError)', () => {
    it('should return AppError instances unchanged', () => {
        const error = new AppError('Test error', 'TEST_CODE');
        const result = createAppError(error, 'test');
        expect(result).toBe(error);
    });

    it('should convert Error instances to AppError', () => {
        const error = new Error('Generic error');
        const result = createAppError(error, 'test');
        expect(result).toBeInstanceOf(AppError);
        expect(result.message).toBe('Generic error');
    });

    it('should handle unknown error types', () => {
        const error = { someProperty: 'value' };
        const result = createAppError(error, 'test');
        expect(result).toBeInstanceOf(AppError);
        // Message should indicate an unexpected error
        expect(result.message.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined', () => {
        const result1 = createAppError(null, 'test');
        const result2 = createAppError(undefined, 'test');
        expect(result1).toBeInstanceOf(AppError);
        expect(result2).toBeInstanceOf(AppError);
    });
});

describe('getUserFriendlyMessage', () => {
    it('should return user-friendly message for TimeoutError', () => {
        const error = new TimeoutError('fetch data', 5000);
        const message = getUserFriendlyMessage(error);
        expect(message).toBe('The operation took too long. Please try again.');
    });

    it('should return user-friendly message for NetworkError', () => {
        const error = new NetworkError('Network failed');
        const message = getUserFriendlyMessage(error);
        expect(message).toBe('Unable to connect. Please check your internet connection.');
    });

    it('should return user-friendly message for AppError', () => {
        const error = new AppError('Custom error', 'CUSTOM');
        const message = getUserFriendlyMessage(error);
        expect(message).toBe('Custom error');
    });

    it('should return message for Error instances', () => {
        const error = new Error('Standard error');
        const message = getUserFriendlyMessage(error);
        expect(message).toBe('Standard error');
    });

    it('should return generic message for unknown errors', () => {
        const message = getUserFriendlyMessage({});
        expect(message).toBe('An unexpected error occurred. Please try again.');
    });
});

describe('withTimeout', () => {
    it('should resolve if promise completes before timeout', async () => {
        const promise = Promise.resolve('success');
        const result = await withTimeout(promise, 1000, 'test');
        expect(result).toBe('success');
    });

    it('should reject if promise exceeds timeout', async () => {
        const promise = new Promise(resolve => setTimeout(() => resolve('slow'), 2000));
        await expect(
            withTimeout(promise, 100, 'test')
        ).rejects.toThrow(/timed out/);
    });
});

describe('withRetry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Helper to create retryable error
    function createRetryableError(message: string): Error & { retryable: boolean } {
        const error = new Error(message) as Error & { retryable: boolean };
        error.retryable = true;
        return error;
    }

    it('should succeed on first attempt', async () => {
        const fn = vi.fn().mockResolvedValue('success');
        const result = await withRetry(fn, { maxRetries: 3 });
        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
        let attempts = 0;
        const fn = vi.fn().mockImplementation(() => {
            attempts++;
            if (attempts < 3) {
                return Promise.reject(createRetryableError('Failed'));
            }
            return Promise.resolve('success');
        });

        const result = await withRetry(fn, { maxRetries: 3, initialDelay: 10 });
        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should fail after max retries', async () => {
        const fn = vi.fn().mockImplementation(() => {
            return Promise.reject(createRetryableError('Always fails'));
        });
        await expect(
            withRetry(fn, { maxRetries: 2, initialDelay: 10 })
        ).rejects.toThrow('Always fails');
        expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    }, 10000);
});
