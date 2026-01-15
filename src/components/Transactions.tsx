import React, { useEffect, useState, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { Transaction, ViewState } from '../types';
import { Download, Filter, ExternalLink, FileText, Loader2, Calendar, X, Radio } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { mapTransactionStatus, mapTransactionType, mapTransactionChannel } from '../lib/mappers';
import { LoadingSpinner, ErrorDisplay, EmptyState, Button, SearchInput, Badge } from './ui';
import { TransactionsSkeleton } from './ui/PageSkeletons';
import { VirtualizedTransactionTable } from './Transactions/VirtualizedTransactionTable';
import { BulkActions } from './Transactions/BulkActions';
import { DraggableTransaction } from './Transactions/DragDropAllocation';
import { useRealtimeTransactions } from '../hooks/useRealtime';
import { isSuperAdmin } from '../lib/utils/roleHelpers';
import { useTransactionsPaginated } from '../hooks/useTransactionsPaginated';
import { useIsMobile } from '../hooks/useResponsive';

const TransactionDrawer = lazy(() => import('./TransactionDrawer'));

interface TransactionsProps {
  transactions?: Transaction[];
  onNavigate?: (view: ViewState) => void;
}

type StatusFilter = 'all' | 'unallocated' | 'allocated' | 'flagged';

interface SupabaseTransaction {
  id: string;
  institution_id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  type: string;
  channel: string;
  status: string;
  reference: string | null;
  momo_ref: string | null;
  payer_phone: string | null;
  payer_name: string | null;
  member_id: string | null;
  group_id: string | null;
  allocation_status: string;
  members?: { full_name: string };
  groups?: { name: string };
}

const INITIAL_LOAD = 50;
const LOAD_MORE = 25;

const Transactions: React.FC<TransactionsProps> = ({ transactions: transactionsProp, onNavigate }) => {
  const { institutionId, role } = useAuth();
  const isMobile = useIsMobile();
  const isPlatformAdmin = isSuperAdmin(role);

  // Selection state for bulk actions
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [exportError, setExportError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Drawer state
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Ref for infinite scroll container
  const containerRef = useRef<HTMLDivElement>(null);

  // Pagination Hook
  const {
    transactions,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refetch,
    error
  } = useTransactionsPaginated({
    limit: INITIAL_LOAD,
    autoFetch: true,
    status: statusFilter === 'all' ? undefined : statusFilter,
    dateRange,
    searchTerm
  });

  // Infinite scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (loadingMore || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 300) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadMore, loadingMore]);

  const handleRowClick = (txId: string) => {
    setSelectedTransactionId(txId);
    setDrawerOpen(true);
  };

  const handleAllocationSuccess = () => {
    // Reload transactions to reflect allocation
    refetch();
    // Clear selection after bulk action
    setSelectedTransactionIds(new Set());
  };



  // Handle selection toggle
  const handleSelectionToggle = useCallback((transactionId: string) => {
    setSelectedTransactionIds(prev => {
      const next = new Set(prev);
      if (next.has(transactionId)) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    setSelectedTransactionIds(new Set(transactions.map(tx => tx.id)));
  }, [transactions]);

  // Handle deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedTransactionIds(new Set());
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'allocated':
        return <Badge variant="success">Allocated</Badge>;
      case 'unallocated':
        return <Badge variant="warning">Unallocated</Badge>;
      case 'flagged':
        return <Badge variant="danger">Flagged</Badge>;
      case 'duplicate':
        return <Badge variant="default">Duplicate</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };



  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
      {error && <ErrorDisplay error={error} variant="banner" onRetry={refetch} />}


      {/* Header with filters */}
      <div className="p-4 border-b border-slate-100 space-y-4">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800">Transactions Ledger</h2>
            </div>
            <p className="text-xs text-slate-500">{transactions?.length || 0} transactions loaded</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <SearchInput
              placeholder="Search phone, ref, name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              className="flex-1 sm:w-64"
            />
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={16} />}
              onClick={async () => {
                try {
                  const { exportTransactions } = await import('../lib/csv/export');
                  // Cast transactions to the expected format
                  const exportData = transactions.map(tx => ({
                    id: tx.id,
                    occurred_at: tx.occurred_at,
                    amount: tx.amount,
                    currency: tx.currency || 'RWF',
                    type: tx.type,
                    channel: tx.channel,
                    status: tx.status || 'COMPLETED',
                    allocation_status: tx.allocation_status,
                    payer_name: tx.payer_name || '',
                    payer_phone: tx.payer_phone || '',
                    momo_ref: tx.momo_ref || '',
                    reference: tx.reference || '',
                    members: tx.members ? { full_name: tx.members.full_name } : undefined,
                    groups: tx.groups ? { name: tx.groups.name } : undefined,
                  }));
                  exportTransactions(exportData as any, {
                    filename: `transactions_${dateRange.start}_to_${dateRange.end}.csv`,
                  });
                } catch (err) {
                  console.error('Export failed:', err);
                  setExportError('Failed to export transactions');
                }
              }}
            >
              Export
            </Button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2">
          {(['all', 'unallocated', 'allocated', 'flagged'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 7);
                setDateRange({
                  start: start.toISOString().split('T')[0],
                  end: end.toISOString().split('T')[0]
                });
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              Reset to last 7 days
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedTransactionIds.size > 0 && (
        <div className="px-4 py-3 border-b border-slate-100">
          <BulkActions
            selectedIds={selectedTransactionIds}
            onSelectionChange={setSelectedTransactionIds}
            onBulkActionComplete={handleAllocationSuccess}
            totalCount={transactions.length}
          />
        </div>
      )}

      {/* Table with infinite scroll */}
      {loading && transactions.length === 0 ? (
        <div className="flex-1 overflow-hidden">
          {!isMobile ? (
            <TransactionsSkeleton />
          ) : (
            <TransactionsSkeleton />
          )}
        </div>
      ) : (
        <div ref={containerRef} className="flex-1 overflow-hidden flex flex-col">
          {/* Desktop Table with Virtualization */}
          {!isMobile && (
            <div className="flex-1 overflow-hidden">
              <VirtualizedTransactionTable
                transactions={transactions}
                onRowClick={handleRowClick}
                formatDate={formatDate}
                formatTime={formatTime}
                getStatusBadge={getStatusBadge}
                onScroll={loadMore}
                loadingMore={loadingMore}
                hasMore={hasMore}
                selectedIds={selectedTransactionIds}
                onSelectionToggle={handleSelectionToggle}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
              />
            </div>
          )}

          {/* Mobile Cards */}
          {isMobile && (
            <div className="p-4 space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all ${selectedTransactionIds.has(tx.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 cursor-pointer'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTransactionIds.has(tx.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectionToggle(tx.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <div
                      onClick={() => handleRowClick(tx.id)}
                      className="flex-1"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {tx.amount.toLocaleString()} {tx.currency || 'RWF'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDate(tx.occurred_at)} • {formatTime(tx.occurred_at)}
                          </div>
                        </div>
                        {getStatusBadge(tx.allocation_status)}
                      </div>
                      <div className="text-sm text-slate-700">
                        {tx.payer_name || tx.payer_phone || '—'}
                      </div>
                      {tx.momo_ref && (
                        <div className="text-xs text-slate-400 font-mono mt-1">
                          Ref: {tx.momo_ref}
                        </div>
                      )}
                      {tx.member_id && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                          Allocated to: {tx.members?.full_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loadingMore && (
                <div className="py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Loading more...</span>
                  </div>
                </div>
              )}

              {!hasMore && transactions.length > 0 && (
                <div className="py-4 text-center text-sm text-slate-400">
                  All {transactions.length} transactions loaded
                </div>
              )}
            </div>
          )}

          {transactions.length === 0 && !loading && (
            <EmptyState
              icon={FileText}
              title={searchTerm ? 'No transactions found' : 'No transactions yet'}
              description={searchTerm
                ? 'No transactions match your search.'
                : 'Record activity to populate the ledger.'}
            />
          )}
        </div>
      )}

      {/* Transaction Drawer */}
      <Suspense fallback={null}>
        <TransactionDrawer
          transactionId={selectedTransactionId}
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedTransactionId(null);
          }}
          onAllocationSuccess={handleAllocationSuccess}
        />
      </Suspense>
    </div>
  );
};

export default Transactions;
