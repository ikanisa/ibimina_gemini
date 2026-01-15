/**
 * Responsive Data Table Component
 * Adapts to mobile with card view
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { useIsMobile } from '@/shared/hooks/useResponsive';

// ============================================================================
// TYPES
// ============================================================================

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
    className?: string;
    mobileLabel?: string; // Label to show in mobile card view
    hiddenOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    className?: string;
    stickyHeader?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

// ============================================================================
// COMPONENT
// ============================================================================

export function ResponsiveTable<T>({
    data,
    columns,
    keyExtractor,
    onRowClick,
    emptyMessage = 'No data available',
    className = '',
    stickyHeader = false,
}: ResponsiveTableProps<T>) {
    const isMobile = useIsMobile();
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortKey(null);
                setSortDirection(null);
            } else {
                setSortDirection('asc');
            }
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const sortedData = React.useMemo(() => {
        if (!sortKey || !sortDirection) return data;

        return [...data].sort((a, b) => {
            const aVal = (a as any)[sortKey];
            const bVal = (b as any)[sortKey];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = aVal < bVal ? -1 : 1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [data, sortKey, sortDirection]);

    const getSortIcon = (key: string) => {
        if (sortKey !== key) return <ArrowUpDown size={14} className="text-slate-400" />;
        if (sortDirection === 'asc') return <ChevronUp size={14} className="text-blue-600" />;
        return <ChevronDown size={14} className="text-blue-600" />;
    };

    if (data.length === 0) {
        return (
            <div className={`text-center py-12 text-slate-500 ${className}`}>
                {emptyMessage}
            </div>
        );
    }

    const visibleColumns = columns.filter(c => !c.hiddenOnMobile);

    return (
        <div className={className}>
            {/* Desktop Table View */}
            {!isMobile && (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`
                    px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer hover:bg-slate-100 select-none' : ''}
                    ${column.className || ''}
                  `}
                                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                                >
                                    <span className="flex items-center gap-1">
                                        {column.header}
                                        {column.sortable && getSortIcon(column.key)}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedData.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                className={`
                  bg-white hover:bg-slate-50 transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                                onClick={onRowClick ? () => onRowClick(item) : undefined}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={`px-4 py-3 text-sm text-slate-700 ${column.className || ''}`}
                                    >
                                        {column.render
                                            ? column.render(item)
                                            : String((item as any)[column.key] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}

            {/* Mobile Card View */}
            {isMobile && (
            <div className="space-y-3">
                {sortedData.map((item) => (
                    <div
                        key={keyExtractor(item)}
                        className={`
              bg-white rounded-lg border border-slate-200 p-4
              ${onRowClick ? 'cursor-pointer active:bg-slate-50' : ''}
            `}
                        onClick={onRowClick ? () => onRowClick(item) : undefined}
                    >
                        {visibleColumns.map((column, index) => (
                            <div
                                key={column.key}
                                className={`
                  flex justify-between items-start
                  ${index !== 0 ? 'mt-2 pt-2 border-t border-slate-100' : ''}
                `}
                            >
                                <span className="text-xs font-medium text-slate-500 uppercase">
                                    {column.mobileLabel || column.header}
                                </span>
                                <span className="text-sm text-slate-900 text-right ml-4">
                                    {column.render
                                        ? column.render(item)
                                        : String((item as any)[column.key] ?? '')}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            )}
        </div>
    );
}

export default ResponsiveTable;
