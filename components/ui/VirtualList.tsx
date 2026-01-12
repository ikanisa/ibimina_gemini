/**
 * Virtualized List Component
 * Efficiently renders large lists using windowing
 * Uses react-window for performance
 */

import React, { useCallback, useRef, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface VirtualListProps<T> {
    items: T[];
    height: number;
    itemHeight: number;
    renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
    keyExtractor: (item: T, index: number) => string;
    overscan?: number;
    className?: string;
    emptyMessage?: string;
}

interface VirtualListState {
    scrollTop: number;
}

// ============================================================================
// VIRTUAL LIST COMPONENT
// Simple implementation without external dependencies
// For larger datasets, consider adding react-window
// ============================================================================

export function VirtualList<T>({
    items,
    height,
    itemHeight,
    renderItem,
    keyExtractor,
    overscan = 3,
    className = '',
    emptyMessage = 'No items',
}: VirtualListProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = React.useState(0);

    const totalHeight = items.length * itemHeight;

    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + height) / itemHeight) + overscan
    );

    const visibleItems = useMemo(() => {
        return items.slice(startIndex, endIndex);
    }, [items, startIndex, endIndex]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    if (items.length === 0) {
        return (
            <div
                className={`flex items-center justify-center text-slate-500 ${className}`}
                style={{ height }}
            >
                {emptyMessage}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`overflow-auto ${className}`}
            style={{ height }}
            onScroll={handleScroll}
        >
            {/* Spacer to enable scrolling */}
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems.map((item, index) => {
                    const actualIndex = startIndex + index;
                    const style: React.CSSProperties = {
                        position: 'absolute',
                        top: actualIndex * itemHeight,
                        left: 0,
                        right: 0,
                        height: itemHeight,
                    };

                    return (
                        <div key={keyExtractor(item, actualIndex)} style={style}>
                            {renderItem(item, actualIndex, style)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// VIRTUALIZED TABLE
// ============================================================================

interface Column<T> {
    key: string;
    header: string;
    width?: number | string;
    render?: (item: T) => React.ReactNode;
}

interface VirtualTableProps<T> {
    items: T[];
    columns: Column<T>[];
    height: number;
    rowHeight?: number;
    keyExtractor: (item: T) => string;
    onRowClick?: (item: T) => void;
    className?: string;
}

export function VirtualTable<T>({
    items,
    columns,
    height,
    rowHeight = 48,
    keyExtractor,
    onRowClick,
    className = '',
}: VirtualTableProps<T>) {
    const headerHeight = 44;
    const listHeight = height - headerHeight;

    const renderRow = useCallback(
        (item: T, index: number, style: React.CSSProperties) => (
            <div
                style={{ ...style, display: 'flex', alignItems: 'center' }}
                className={`
          border-b border-slate-100
          ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
          ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : ''}
        `}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
                {columns.map((col) => (
                    <div
                        key={col.key}
                        className="px-4 py-2 text-sm text-slate-700 truncate"
                        style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
                    >
                        {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                    </div>
                ))}
            </div>
        ),
        [columns, onRowClick]
    );

    return (
        <div className={className}>
            {/* Header */}
            <div
                className="flex bg-slate-100 border-b border-slate-200"
                style={{ height: headerHeight }}
            >
                {columns.map((col) => (
                    <div
                        key={col.key}
                        className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider truncate"
                        style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
                    >
                        {col.header}
                    </div>
                ))}
            </div>

            {/* Virtualized Body */}
            <VirtualList
                items={items}
                height={listHeight}
                itemHeight={rowHeight}
                renderItem={renderRow}
                keyExtractor={keyExtractor}
                emptyMessage="No data available"
            />
        </div>
    );
}

export default VirtualList;
