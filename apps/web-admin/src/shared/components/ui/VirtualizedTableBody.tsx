/**
 * Virtualized Table Body Component
 * Efficiently renders large table rows using @tanstack/react-virtual
 * Works with HTML table structure
 */

import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualizedTableBodyProps<T> {
  items: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  rowHeight?: number;
  overscan?: number;
  className?: string;
  onScroll?: () => void;
  parentRef?: React.RefObject<HTMLElement>;
}

export function VirtualizedTableBody<T>({
  items,
  renderRow,
  keyExtractor,
  rowHeight = 72,
  overscan = 5,
  className = '',
  onScroll,
  parentRef: externalParentRef,
}: VirtualizedTableBodyProps<T>) {
  const internalParentRef = useRef<HTMLDivElement>(null);
  const parentRef = externalParentRef || internalParentRef;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => {
      // Find the scrollable parent
      if (parentRef.current) {
        let element: HTMLElement | null = parentRef.current.parentElement;
        while (element) {
          const style = window.getComputedStyle(element);
          if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflowY === 'scroll') {
            return element;
          }
          element = element.parentElement;
        }
      }
      return null;
    },
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    if (onScroll && parentRef.current) {
      const scrollElement = parentRef.current.closest('.overflow-auto') || parentRef.current.parentElement;
      if (scrollElement) {
        const handleScroll = () => {
          onScroll();
        };
        scrollElement.addEventListener('scroll', handleScroll);
        return () => scrollElement.removeEventListener('scroll', handleScroll);
      }
    }
  }, [onScroll, parentRef]);

  if (items.length === 0) {
    return null;
  }

  return (
    <tbody ref={parentRef as React.RefObject<HTMLTableSectionElement>} className={className}>
      <tr style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <td colSpan={100} style={{ padding: 0, height: '100%', position: 'relative' }}>
          <div style={{ position: 'relative', height: '100%' }}>
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
                  <table style={{ width: '100%' }}>
                    <tbody>
                      {renderRow(item, virtualItem.index)}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
