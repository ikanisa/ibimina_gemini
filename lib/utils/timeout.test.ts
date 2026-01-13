/**
 * Timeout Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout, createTimeout, TimeoutError } from './timeout';

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve if promise completes before timeout', async () => {
    const promise = Promise.resolve('success');
    const resultPromise = withTimeout(promise, 1000, 'test');
    
    vi.advanceTimersByTime(500);
    const result = await resultPromise;
    expect(result).toBe('success');
  });

  it('should reject if promise exceeds timeout', async () => {
    const promise = new Promise(resolve => 
      setTimeout(() => resolve('slow'), 2000)
    );
    const resultPromise = withTimeout(promise, 1000, 'test');
    
    vi.advanceTimersByTime(1000);
    await expect(resultPromise).rejects.toThrow(TimeoutError);
  });
});

describe('createTimeout', () => {
  it('should create a cancellable timeout', () => {
    const { promise, cancel } = createTimeout(1000);
    cancel();
    // Should not reject if cancelled
    expect(promise).toBeDefined();
  });
});
