/**
 * usePagination Hook Tests
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';

describe('usePagination', () => {
  it('should initialize with default values', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(data));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.items).toHaveLength(20);
  });

  it('should calculate total pages correctly', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => 
      usePagination(data, { initialPageSize: 20 })
    );
    expect(result.current.totalPages).toBe(5);
  });

  it('should navigate to next page', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(data));
    act(() => {
      result.current.nextPage();
    });
    expect(result.current.page).toBe(2);
  });

  it('should navigate to previous page', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(data));
    act(() => {
      result.current.nextPage();
    });
    expect(result.current.page).toBe(2);
    act(() => {
      result.current.previousPage();
    });
    expect(result.current.page).toBe(1);
  });

  it('should not go below page 1', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(data));
    act(() => {
      result.current.previousPage();
    });
    expect(result.current.page).toBe(1);
  });

  it('should not go beyond last page', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => 
      usePagination(data, { initialPageSize: 50 })
    );
    act(() => {
      result.current.nextPage();
      result.current.nextPage();
    });
    expect(result.current.page).toBe(2); // Max page
  });

  it('should go to specific page', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => usePagination(data));
    act(() => {
      result.current.goToPage(5);
    });
    expect(result.current.page).toBe(5);
  });

  it('should return paginated items', () => {
    const items = Array.from({ length: 100 }, (_, i) => i + 1);
    const { result } = renderHook(() => 
      usePagination(items, { initialPageSize: 10 })
    );
    act(() => {
      result.current.goToPage(2);
    });
    expect(result.current.items).toHaveLength(10);
    expect(result.current.items[0]).toBe(11);
  });
});
