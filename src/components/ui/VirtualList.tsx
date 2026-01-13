/**
 * Virtualized List Component
 * Efficiently renders large lists using @tanstack/react-virtual
 * Provides windowing for optimal performance with thousands of items
 */

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// ============================================================================
// TYPES
// ============================================================================

export interface VirtualListProps<T> {
  items: T[];
  height: number | string;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
  onScroll?: (scrollTop: number) => void;
  estimateSize?: number;
}

// ============================================================================
// VIRTUAL LIST COMPONENT
// ============================================================================

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  keyExtractor,
  overscan = 5,
  className = '',
  emptyMessage = 'No items',
  onScroll,
  estimateSize,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: typeof itemHeight === 'number' 
      ? () => itemHeight 
      : itemHeight,
    overscan,
    ...(estimateSize && { estimateSize }),
  });

  // Handle scroll events
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) {
      onScroll(e.currentTarget.scrollTop);
    }
  };

  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-slate-500 ${className}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={keyExtractor(item, virtualItem.index)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// VIRTUALIZED TABLE ROW COMPONENT
// Helper component for table rows
// ============================================================================

export interface VirtualTableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const VirtualTableRow: React.FC<VirtualTableRowProps> = ({
  children,
  onClick,
  className = '',
  style,
}) => {
  return (
    <div
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer hover:bg-slate-50 active:bg-slate-100' : ''} transition-colors ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default VirtualList;
