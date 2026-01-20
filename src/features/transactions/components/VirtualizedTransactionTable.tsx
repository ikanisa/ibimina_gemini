/**
 * Virtualized Transaction Table Component
 * Efficiently renders large transaction lists using @tanstack/react-virtual
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, CheckSquare, Square } from 'lucide-react';
import { Badge } from '@/shared/components/ui';

// Flexible transaction type that works with various data sources
interface TransactionRow {
  id: string;
  occurred_at: string;
  amount: number;
  currency?: string;
  channel?: string;
  allocation_status: string;
  payer_name?: string | null;
  payer_phone?: string | null;
  momo_ref?: string | null;
  reference?: string | null;
  member_id?: string | null;
  members?: { full_name?: string | null };
  groups?: { name?: string | null };
}

interface VirtualizedTransactionTableProps {
  transactions: TransactionRow[];
  onRowClick: (transactionId: string) => void;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  onScroll?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  selectedIds?: Set<string>;
  onSelectionToggle?: (transactionId: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
}

export const VirtualizedTransactionTable: React.FC<VirtualizedTransactionTableProps> = ({
  transactions,
  onRowClick,
  formatDate,
  formatTime,
  getStatusBadge,
  onScroll,
  loadingMore = false,
  hasMore = false,
  selectedIds = new Set(),
  onSelectionToggle,
  onSelectAll,
  onDeselectAll,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Row height
    overscan: 10,
  });

  // Handle scroll for infinite loading
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement || !onScroll) return;

    const handleScroll = () => {
      if (!loadingMore && hasMore) {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        if (scrollHeight - scrollTop - clientHeight < 300) {
          onScroll();
        }
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [onScroll, loadingMore, hasMore]);

  const virtualItems = virtualizer.getVirtualItems();

  // Selection state
  const allSelected = useMemo(() => {
    return transactions.length > 0 && transactions.every(tx => selectedIds.has(tx.id));
  }, [transactions, selectedIds]);

  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && !allSelected;
  }, [selectedIds, allSelected]);

  const handleSelectAllClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allSelected) {
      onDeselectAll?.();
    } else {
      onSelectAll?.();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-700 sticky top-0 z-10 grid grid-cols-12 px-4 py-3 text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
        {onSelectionToggle && (
          <div className="col-span-1 flex items-center">
            <button
              onClick={handleSelectAllClick}
              className="p-1 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded transition-colors"
              title={allSelected ? 'Deselect all' : 'Select all'}
            >
              {allSelected ? (
                <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" />
              ) : someSelected ? (
                <div className="relative">
                  <Square size={18} className="text-slate-400 dark:text-neutral-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-sm" />
                  </div>
                </div>
              ) : (
                <Square size={18} className="text-slate-400 dark:text-neutral-500" />
              )}
            </button>
          </div>
        )}
        <div className={onSelectionToggle ? "col-span-2" : "col-span-2"}>Date</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-2">Payer</div>
        <div className="col-span-2">Ref</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Allocated To</div>
      </div>

      {/* Virtualized Body */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const tx = transactions[virtualItem.index];
            const isSelected = selectedIds.has(tx.id);
            const isUnallocated = tx.allocation_status === 'unallocated';
            return (
              <div
                key={tx.id}
                className="absolute"
                style={{
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div
                  onClick={() => onRowClick(tx.id)}
                  className={`grid grid-cols-12 px-4 py-3 items-center border-b transition-colors cursor-pointer ${isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    : 'border-slate-100 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800 active:bg-slate-100 dark:active:bg-neutral-700'
                    } ${isUnallocated ? 'opacity-100' : 'opacity-90'}`}
                >
                  {onSelectionToggle && (
                    <div className="col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectionToggle(tx.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 border-slate-300 dark:border-neutral-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  )}
                  <div className={onSelectionToggle ? "col-span-2 whitespace-nowrap" : "col-span-2 whitespace-nowrap"}>
                    <div className="text-sm text-slate-900 dark:text-neutral-100 font-medium">{formatDate(tx.occurred_at)}</div>
                    <div className="text-xs text-slate-400 dark:text-neutral-500">{formatTime(tx.occurred_at)}</div>
                  </div>
                  <div className="col-span-2 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      {tx.amount.toLocaleString()} {tx.currency || 'RWF'}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-neutral-500">{tx.channel}</div>
                  </div>
                  <div className="col-span-2 whitespace-nowrap">
                    <div className="text-sm text-slate-900 dark:text-neutral-100">
                      {tx.payer_name || tx.payer_phone || '—'}
                    </div>
                    {tx.payer_name && tx.payer_phone && (
                      <div className="text-xs text-slate-400 dark:text-neutral-500 font-mono">{tx.payer_phone}</div>
                    )}
                  </div>
                  <div className="col-span-2 whitespace-nowrap">
                    <div className="text-xs text-slate-600 dark:text-neutral-400 font-mono max-w-[120px] truncate">
                      {tx.momo_ref || tx.reference || '—'}
                    </div>
                  </div>
                  <div className="col-span-1 whitespace-nowrap">
                    {getStatusBadge(tx.allocation_status)}
                  </div>
                  <div className="col-span-1 whitespace-nowrap">
                    {tx.member_id ? (
                      <div>
                        <div className="text-sm text-slate-900 dark:text-neutral-100">{tx.members?.full_name || '—'}</div>
                        {tx.groups?.name && (
                          <div className="text-xs text-slate-400 dark:text-neutral-500">{tx.groups.name}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-neutral-500">—</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="px-4 py-4 text-center border-t border-slate-100 dark:border-neutral-700">
            <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-neutral-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          </div>
        )}

        {/* End of list indicator */}
        {!hasMore && transactions.length > 0 && (
          <div className="px-4 py-4 text-center text-sm text-slate-400 dark:text-neutral-500 border-t border-slate-100 dark:border-neutral-700">
            All {transactions.length} transactions loaded
          </div>
        )}
      </div>
    </div>
  );
};
