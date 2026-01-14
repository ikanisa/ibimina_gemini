/**
 * Retry Utilities Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry } from './retry';

// Helper to create retryable error
function createRetryableError(message: string): Error & { retryable: boolean } {
  const error = new Error(message) as Error & { retryable: boolean };
  error.retryable = true;
  return error;
}

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('should use exponential backoff', async () => {
    const fn = vi.fn().mockImplementation(() => {
      return Promise.reject(createRetryableError('Failed'));
    });
    const startTime = Date.now();

    try {
      await withRetry(fn, { maxRetries: 2, initialDelay: 50 });
    } catch {
      // Expected to fail
    }

    const elapsed = Date.now() - startTime;
    // Should have delays between retries (at least initialDelay)
    expect(elapsed).toBeGreaterThan(50);
  }, 10000);
});
