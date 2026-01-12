import React, { useRef, useEffect, useCallback } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { Badge } from '../ui';
import { useIsMobile } from '../../hooks/useResponsive';

interface LedgerRow {
  id: string;
  occurred_at: string;
  amount: number;
  currency?: string;
  allocation_status: string;
  momo_ref?: string;
  payer_phone?: string;
  payer_name?: string;
  member_name?: string;
  member_code?: string;
  group_name?: string;
}

interface ReportLedgerTableProps {
  rows: LedgerRow[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  currency?: string;
  emptyMessage?: string;
}

export const ReportLedgerTable: React.FC<ReportLedgerTableProps> = ({
  rows,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  currency = 'RWF',
  emptyMessage = 'No transactions found'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !hasMore || loadingMore || !onLoadMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'allocated':
        return <Badge variant="success">Allocated</Badge>;
      case 'unallocated':
        return <Badge variant="warning">Unallocated</Badge>;
      case 'error':
        return <Badge variant="danger">Error</Badge>;
      case 'duplicate':
        return <Badge variant="default">Duplicate</Badge>;
      case 'reversed':
        return <Badge variant="default">Reversed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (loading && rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-slate-500">
        <FileText size={40} className="mb-3 text-slate-300" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div 
        ref={containerRef}
        className="max-h-[500px] overflow-y-auto"
      >
        {/* Desktop Table */}
        {!isMobile && (
          <table className="w-full text-left">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Amount</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Payer</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Ref</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Allocated To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-slate-900 font-medium">{formatDate(row.occurred_at)}</div>
                  <div className="text-xs text-slate-400">{formatTime(row.occurred_at)}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-bold text-green-600 tabular-nums">
                    {row.amount.toLocaleString()} {row.currency || currency}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{row.payer_name || row.payer_phone || '—'}</div>
                  {row.payer_name && row.payer_phone && (
                    <div className="text-xs text-slate-400 font-mono">{row.payer_phone}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-xs text-slate-600 font-mono max-w-[120px] truncate">
                    {row.momo_ref || '—'}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusBadge(row.allocation_status)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {row.member_name ? (
                    <div>
                      <div className="text-sm text-slate-900">{row.member_name}</div>
                      {row.group_name && (
                        <div className="text-xs text-slate-400">{row.group_name}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}

        {/* Mobile Cards */}
        {isMobile && (
          <div className="p-4 space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {row.amount.toLocaleString()} {row.currency || currency}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(row.occurred_at)} • {formatTime(row.occurred_at)}
                  </div>
                </div>
                {getStatusBadge(row.allocation_status)}
              </div>
              <div className="text-sm text-slate-700">
                {row.payer_name || row.payer_phone || '—'}
              </div>
              {row.member_name && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
                  Allocated to: {row.member_name}
                </div>
              )}
            </div>
          ))}
        </div>
        )}

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          </div>
        )}

        {/* End of list */}
        {!hasMore && rows.length > 0 && (
          <div className="py-4 text-center text-sm text-slate-400 border-t border-slate-100">
            All {rows.length} transactions loaded
          </div>
        )}
      </div>
    </div>
  );
};

