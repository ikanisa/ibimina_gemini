/**
 * Pagination Controls Component
 * UI for navigating paginated data
 */

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface PaginationProps {
    page: number;
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    pageRange?: number[];
    onPageChange: (page: number) => void;
    onNextPage: () => void;
    onPreviousPage: () => void;
    pageSize?: number;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
    className?: string;
    showPageSize?: boolean;
    variant?: 'default' | 'compact';
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Pagination: React.FC<PaginationProps> = ({
    page,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    pageRange = [],
    onPageChange,
    onNextPage,
    onPreviousPage,
    pageSize = 20,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    className = '',
    showPageSize = true,
    variant = 'default',
}) => {
    if (totalItems === 0) return null;

    const buttonBase = `
    inline-flex items-center justify-center
    min-w-[36px] h-9
    text-sm font-medium
    border border-slate-300 rounded-lg
    transition-all duration-150
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

    const inactiveButton = `${buttonBase} bg-white text-slate-700 hover:bg-slate-50`;
    const activeButton = `${buttonBase} bg-blue-600 text-white border-blue-600`;

    if (variant === 'compact') {
        return (
            <div className={`flex items-center justify-between gap-4 ${className}`}>
                <span className="text-sm text-slate-500">
                    {startIndex + 1}-{endIndex} of {totalItems}
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={onPreviousPage}
                        disabled={!hasPreviousPage}
                        className={inactiveButton}
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={onNextPage}
                        disabled={!hasNextPage}
                        className={inactiveButton}
                        aria-label="Next page"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
            {/* Info */}
            <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>
                    Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of{' '}
                    <strong>{totalItems}</strong> results
                </span>

                {showPageSize && onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">|</span>
                        <label className="flex items-center gap-2">
                            <span>Show</span>
                            <select
                                value={pageSize}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                                className="px-2 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {pageSizeOptions.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                )}
            </div>

            {/* Controls */}
            <nav className="flex items-center gap-1" aria-label="Pagination">
                {/* First page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={page === 1}
                    className={inactiveButton}
                    aria-label="First page"
                >
                    <ChevronsLeft size={18} />
                </button>

                {/* Previous */}
                <button
                    onClick={onPreviousPage}
                    disabled={!hasPreviousPage}
                    className={inactiveButton}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={18} />
                </button>

                {/* Page numbers */}
                <div className="hidden sm:flex items-center gap-1">
                    {pageRange.map((pageNum, index) =>
                        pageNum === -1 ? (
                            <span
                                key={`dots-${index}`}
                                className="px-2 text-slate-400"
                            >
                                ...
                            </span>
                        ) : (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={pageNum === page ? activeButton : inactiveButton}
                                aria-current={pageNum === page ? 'page' : undefined}
                            >
                                {pageNum}
                            </button>
                        )
                    )}
                </div>

                {/* Mobile: show current page */}
                <span className="sm:hidden px-3 text-sm text-slate-700">
                    Page {page} of {totalPages}
                </span>

                {/* Next */}
                <button
                    onClick={onNextPage}
                    disabled={!hasNextPage}
                    className={inactiveButton}
                    aria-label="Next page"
                >
                    <ChevronRight size={18} />
                </button>

                {/* Last page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={page === totalPages}
                    className={inactiveButton}
                    aria-label="Last page"
                >
                    <ChevronsRight size={18} />
                </button>
            </nav>
        </div>
    );
};

export default Pagination;
