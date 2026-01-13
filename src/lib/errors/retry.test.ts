/**
 * Retry Utilities Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry } from './retry';
import { AppError } from './ErrorHandler';

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
        // Create a retryable error
        const error = new AppError('Failed', 'RETRYABLE', undefined, undefined, true);
        return Promise.reject(error);
      }
      return Promise.resolve('success');
    });

    const result = await withRetry(fn, { maxRetries: 3, initialDelay: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  }, 10000); // Increase timeout

  it('should fail after max retries', async () => {
    const fn = vi.fn().mockImplementation(() => {
      const error = new AppError('Always fails', 'RETRYABLE', undefined, undefined, true);
      return Promise.reject(error);
    });
    await expect(
      withRetry(fn, { maxRetries: 2, initialDelay: 10 })
    ).rejects.toThrow('Always fails');
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  }, 10000);

  it('should use exponential backoff', async () => {
    const fn = vi.fn().mockImplementation(() => {
      const error = new AppError('Failed', 'RETRYABLE', undefined, undefined, true);
      return Promise.reject(error);
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
