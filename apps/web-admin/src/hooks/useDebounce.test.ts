/**
 * useDebounce Hook Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Change value multiple times quickly
    rerender({ value: 'changed1' });
    rerender({ value: 'changed2' });
    rerender({ value: 'changed3' });

    // Value should not have changed yet
    expect(result.current).toBe('initial');

    // Advance time past debounce delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Value should now be the last one
    expect(result.current).toBe('changed3');
  });

  it('should use custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('changed');
  });
});
