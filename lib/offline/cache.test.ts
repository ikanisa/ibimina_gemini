/**
 * Offline Cache Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCachedData,
  setCachedData,
  clearCachedData,
  clearAllCachedData,
  clearExpiredCache,
} from './cache';

describe('Offline Cache', () => {
  beforeEach(() => {
    clearAllCachedData();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should set and get cached data', () => {
    const data = { id: '1', name: 'Test' };
    setCachedData('test', data);
    const cached = getCachedData('test');
    expect(cached).toEqual(data);
  });

  it('should return null for non-existent cache', () => {
    const cached = getCachedData('nonexistent');
    expect(cached).toBeNull();
  });

  it('should expire cached data after TTL', () => {
    const data = { id: '1', name: 'Test' };
    setCachedData('test', data, undefined, 1000); // 1 second TTL
    vi.advanceTimersByTime(2000); // Advance 2 seconds
    const cached = getCachedData('test');
    expect(cached).toBeNull();
  });

  it('should clear cached data for specific resource', () => {
    setCachedData('resource1', { data: '1' });
    setCachedData('resource2', { data: '2' });
    clearCachedData('resource1');
    expect(getCachedData('resource1')).toBeNull();
    expect(getCachedData('resource2')).not.toBeNull();
  });

  it('should clear all cached data', () => {
    setCachedData('resource1', { data: '1' });
    setCachedData('resource2', { data: '2' });
    clearAllCachedData();
    expect(getCachedData('resource1')).toBeNull();
    expect(getCachedData('resource2')).toBeNull();
  });

  it('should clear expired cache entries', () => {
    setCachedData('expired', { data: '1' }, undefined, 1000);
    setCachedData('valid', { data: '2' }, undefined, 10000);
    vi.advanceTimersByTime(2000);
    clearExpiredCache();
    expect(getCachedData('expired')).toBeNull();
    expect(getCachedData('valid')).not.toBeNull();
  });
});
