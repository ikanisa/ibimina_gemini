/**
 * Virtualized Transaction Table Component
 * Efficiently renders large transaction lists using @tanstack/react-virtual
 */

import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';
import { Badge } from '../ui';
import type { SupabaseTransaction } from '../../types';

interface VirtualizedTransactionTableProps {
  transactions: Array<SupabaseTransaction & { members?: { full_name?: string | null }; groups?: { name?: string | null } }>;
  onRowClick: (transactionId: string) => void;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  onScroll?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
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

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 grid grid-cols-12 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-2">Payer</div>
        <div className="col-span-2">Ref</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Allocated To</div>
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
            return (
              <div
                key={tx.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onClick={() => onRowClick(tx.id)}
                className="grid grid-cols-12 px-4 py-3 items-center border-b border-slate-100 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="col-span-2 whitespace-nowrap">
                  <div className="text-sm text-slate-900 font-medium">{formatDate(tx.occurred_at)}</div>
                  <div className="text-xs text-slate-400">{formatTime(tx.occurred_at)}</div>
                </div>
                <div className="col-span-2 whitespace-nowrap">
                  <div className="text-sm font-bold text-green-600">
                    {tx.amount.toLocaleString()} {tx.currency || 'RWF'}
                  </div>
                  <div className="text-xs text-slate-400">{tx.channel}</div>
                </div>
                <div className="col-span-2 whitespace-nowrap">
                  <div className="text-sm text-slate-900">
                    {tx.payer_name || tx.payer_phone || '—'}
                  </div>
                  {tx.payer_name && tx.payer_phone && (
                    <div className="text-xs text-slate-400 font-mono">{tx.payer_phone}</div>
                  )}
                </div>
                <div className="col-span-2 whitespace-nowrap">
                  <div className="text-xs text-slate-600 font-mono max-w-[120px] truncate">
                    {tx.momo_ref || tx.reference || '—'}
                  </div>
                </div>
                <div className="col-span-2 whitespace-nowrap">
                  {getStatusBadge(tx.allocation_status)}
                </div>
                <div className="col-span-2 whitespace-nowrap">
                  {tx.member_id ? (
                    <div>
                      <div className="text-sm text-slate-900">{tx.members?.full_name || '—'}</div>
                      {tx.groups?.name && (
                        <div className="text-xs text-slate-400">{tx.groups.name}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="px-4 py-4 text-center border-t border-slate-100">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          </div>
        )}

        {/* End of list indicator */}
        {!hasMore && transactions.length > 0 && (
          <div className="px-4 py-4 text-center text-sm text-slate-400 border-t border-slate-100">
            All {transactions.length} transactions loaded
          </div>
        )}
      </div>
    </div>
  );
};
