/**
 * useOffline Hook Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOffline, useOnlineStatus } from './useOffline';

describe('useOffline', () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return online status', () => {
    const { result } = renderHook(() => useOffline());
    expect(result.current.isOnline).toBe(true);
  });

  it('should update when going offline', async () => {
    const { result } = renderHook(() => useOffline());
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });
  });

  it('should update when going online', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useOffline());
    expect(result.current.isOnline).toBe(false);

    // Go online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
    window.dispatchEvent(new Event('online'));

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });
});

describe('useOnlineStatus', () => {
  it('should return online status', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('should update when status changes', async () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
