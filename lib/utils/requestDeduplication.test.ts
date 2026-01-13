/**
 * Request Deduplication Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { deduplicateRequest, clearPendingRequests } from './requestDeduplication';

describe('deduplicateRequest', () => {
  beforeEach(() => {
    clearPendingRequests();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearPendingRequests();
  });

  it('should execute request on first call', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const result = await deduplicateRequest('key1', fn);
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should deduplicate concurrent requests with same key', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('result'), 100))
    );

    const promise1 = deduplicateRequest('key1', fn);
    const promise2 = deduplicateRequest('key1', fn);
    const promise3 = deduplicateRequest('key1', fn);

    vi.advanceTimersByTime(100);
    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

    expect(result1).toBe('result');
    expect(result2).toBe('result');
    expect(result3).toBe('result');
    // Function should only be called once
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('should not deduplicate requests with different keys', async () => {
    const fn = vi.fn().mockResolvedValue('result');

    await Promise.all([
      deduplicateRequest('key1', fn),
      deduplicateRequest('key2', fn),
      deduplicateRequest('key3', fn),
    ]);

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should handle errors correctly', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Failed'));

    await expect(
      deduplicateRequest('key1', fn)
    ).rejects.toThrow('Failed');
  });
});
