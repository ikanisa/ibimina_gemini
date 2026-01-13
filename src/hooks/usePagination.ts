/**
 * Pagination Hook
 * Reusable pagination logic for lists and tables
 */

import { useState, useMemo, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationState {
    page: number;
    pageSize: number;
    totalItems: number;
}

export interface PaginationResult<T> {
    // Data
    items: T[];
    totalItems: number;
    totalPages: number;

    // Current state
    page: number;
    pageSize: number;

    // Computed
    startIndex: number;
    endIndex: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;

    // Actions
    goToPage: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    setPageSize: (size: number) => void;

    // Info
    pageRange: number[];
}

export interface UsePaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    siblingCount?: number;
}

// ============================================================================
// HOOK FOR CLIENT-SIDE PAGINATION
// ============================================================================

export function usePagination<T>(
    data: T[],
    options: UsePaginationOptions = {}
): PaginationResult<T> {
    const {
        initialPage = 1,
        initialPageSize = 20,
        siblingCount = 1,
    } = options;

    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSizeState] = useState(initialPageSize);

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Ensure page is in valid range
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    if (validPage !== page) {
        setPage(validPage);
    }

    const startIndex = (validPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    const items = useMemo(() => {
        return data.slice(startIndex, endIndex);
    }, [data, startIndex, endIndex]);

    const hasNextPage = validPage < totalPages;
    const hasPreviousPage = validPage > 1;

    const goToPage = useCallback((newPage: number) => {
        setPage(Math.max(1, Math.min(newPage, totalPages)));
    }, [totalPages]);

    const nextPage = useCallback(() => {
        if (hasNextPage) {
            setPage((p) => p + 1);
        }
    }, [hasNextPage]);

    const previousPage = useCallback(() => {
        if (hasPreviousPage) {
            setPage((p) => p - 1);
        }
    }, [hasPreviousPage]);

    const handleSetPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setPage(1); // Reset to first page when changing size
    }, []);

    // Generate page range for pagination UI
    const pageRange = useMemo(() => {
        const range: number[] = [];
        const leftSiblingIndex = Math.max(1, validPage - siblingCount);
        const rightSiblingIndex = Math.min(totalPages, validPage + siblingCount);

        const showLeftDots = leftSiblingIndex > 2;
        const showRightDots = rightSiblingIndex < totalPages - 1;

        if (!showLeftDots && showRightDots) {
            const leftRange = 3 + 2 * siblingCount;
            for (let i = 1; i <= Math.min(leftRange, totalPages); i++) {
                range.push(i);
            }
            if (totalPages > leftRange) {
                range.push(-1); // Dots indicator
                range.push(totalPages);
            }
        } else if (showLeftDots && !showRightDots) {
            range.push(1);
            range.push(-1); // Dots indicator
            const rightRange = 3 + 2 * siblingCount;
            for (let i = Math.max(1, totalPages - rightRange + 1); i <= totalPages; i++) {
                range.push(i);
            }
        } else if (showLeftDots && showRightDots) {
            range.push(1);
            range.push(-1);
            for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
                range.push(i);
            }
            range.push(-1);
            range.push(totalPages);
        } else {
            for (let i = 1; i <= totalPages; i++) {
                range.push(i);
            }
        }

        return range;
    }, [validPage, totalPages, siblingCount]);

    return {
        items,
        totalItems,
        totalPages,
        page: validPage,
        pageSize,
        startIndex,
        endIndex,
        hasNextPage,
        hasPreviousPage,
        goToPage,
        nextPage,
        previousPage,
        setPageSize: handleSetPageSize,
        pageRange,
    };
}

// ============================================================================
// HOOK FOR SERVER-SIDE PAGINATION
// ============================================================================

export interface UseServerPaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    totalItems: number;
    onPageChange?: (page: number, pageSize: number) => void;
}

export function useServerPagination(
    options: UseServerPaginationOptions
) {
    const {
        initialPage = 1,
        initialPageSize = 20,
        totalItems,
        onPageChange,
    } = options;

    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSizeState] = useState(initialPageSize);

    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    const startIndex = (page - 1) * pageSize + 1;
    const endIndex = Math.min(page * pageSize, totalItems);

    const goToPage = useCallback((newPage: number) => {
        const validPage = Math.max(1, Math.min(newPage, totalPages));
        setPage(validPage);
        onPageChange?.(validPage, pageSize);
    }, [totalPages, pageSize, onPageChange]);

    const nextPage = useCallback(() => {
        if (hasNextPage) {
            goToPage(page + 1);
        }
    }, [hasNextPage, page, goToPage]);

    const previousPage = useCallback(() => {
        if (hasPreviousPage) {
            goToPage(page - 1);
        }
    }, [hasPreviousPage, page, goToPage]);

    const handleSetPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setPage(1);
        onPageChange?.(1, size);
    }, [onPageChange]);

    return {
        page,
        pageSize,
        totalItems,
        totalPages,
        startIndex,
        endIndex,
        hasNextPage,
        hasPreviousPage,
        goToPage,
        nextPage,
        previousPage,
        setPageSize: handleSetPageSize,
    };
}

export default usePagination;
