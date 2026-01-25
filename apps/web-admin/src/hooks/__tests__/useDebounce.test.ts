/**
 * useDebounce Hook Tests
 * Tests for the debounce hook functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('does not update value before delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        // Update the value
        rerender({ value: 'updated', delay: 500 });

        // Before delay, should still be initial
        expect(result.current).toBe('initial');
    });

    it('updates value after delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        // Update the value
        rerender({ value: 'updated', delay: 500 });

        // Fast forward past the delay
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe('updated');
    });

    it('only returns latest value after rapid changes', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        // Multiple rapid updates
        rerender({ value: 'update1', delay: 500 });
        act(() => { vi.advanceTimersByTime(100); });

        rerender({ value: 'update2', delay: 500 });
        act(() => { vi.advanceTimersByTime(100); });

        rerender({ value: 'update3', delay: 500 });
        act(() => { vi.advanceTimersByTime(100); });

        rerender({ value: 'final', delay: 500 });

        // Still should be initial (not enough time passed)
        expect(result.current).toBe('initial');

        // Fast forward past delay from last update
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // Should only have the final value
        expect(result.current).toBe('final');
    });

    it('respects different delay values', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 1000 } }
        );

        rerender({ value: 'updated', delay: 1000 });

        act(() => { vi.advanceTimersByTime(500); });
        expect(result.current).toBe('initial');

        act(() => { vi.advanceTimersByTime(500); });
        expect(result.current).toBe('updated');
    });

    it('handles zero delay', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 0 } }
        );

        rerender({ value: 'updated', delay: 0 });

        act(() => { vi.advanceTimersByTime(0); });
        expect(result.current).toBe('updated');
    });

    it('cleans up timeout on unmount', () => {
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

        const { unmount, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'initial', delay: 500 } }
        );

        rerender({ value: 'updated', delay: 500 });
        unmount();

        expect(clearTimeoutSpy).toHaveBeenCalled();
    });
});

describe('useDebounce with different types', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('works with numbers', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 0, delay: 300 } }
        );

        rerender({ value: 42, delay: 300 });
        act(() => { vi.advanceTimersByTime(300); });
        expect(result.current).toBe(42);
    });

    it('works with objects', () => {
        const initial = { name: 'initial' };
        const updated = { name: 'updated' };

        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: initial, delay: 300 } }
        );

        rerender({ value: updated, delay: 300 });
        act(() => { vi.advanceTimersByTime(300); });
        expect(result.current).toEqual(updated);
    });

    it('works with null and undefined', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: null as string | null, delay: 300 } }
        );

        rerender({ value: 'not null', delay: 300 });
        act(() => { vi.advanceTimersByTime(300); });
        expect(result.current).toBe('not null');
    });
});
