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
import { deduplicateRequest } from '../lib/utils/requestDeduplication';
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
  const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  
  // Selection state for bulk actions
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());

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
  const [showFilters, setShowFilters] = useState(false);

  // Drawer state
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadTransactions = useCallback(async (loadOffset: number, limit: number, append: boolean = false) => {
    // Super Admin can access all transactions, others need institutionId
    if (!isPlatformAdmin && !institutionId) return;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Use deduplication to prevent duplicate requests
      const key = `loadTransactions:${isPlatformAdmin ? 'all' : institutionId}:${loadOffset}:${limit}:${statusFilter}:${dateRange.start}:${dateRange.end}:${searchTerm}`;
      
      const fetchedData = await deduplicateRequest(key, async () => {
        let query = supabase
          .from('transactions')
          .select('*, members(full_name), groups(name)')
          .gte('occurred_at', `${dateRange.start}T00:00:00`)
          .lte('occurred_at', `${dateRange.end}T23:59:59`)
          .order('occurred_at', { ascending: false });

        // Filter by institution if not platform admin
        if (!isPlatformAdmin && institutionId) {
          query = query.eq('institution_id', institutionId);
        }

        // Apply status filter
        if (statusFilter !== 'all') {
          query = query.eq('allocation_status', statusFilter);
        }

        // Apply search
        if (searchTerm.trim()) {
          query = query.or(`payer_phone.ilike.%${searchTerm}%,momo_ref.ilike.%${searchTerm}%,payer_name.ilike.%${searchTerm}%`);
        }

        const { data, error: fetchError } = await query.range(loadOffset, loadOffset + limit - 1);

        if (fetchError) throw fetchError;

        return (data || []) as SupabaseTransaction[];
      });

      if (append) {
        setTransactions(prev => [...prev, ...fetchedData]);
      } else {
        setTransactions(fetchedData);
      }

      setOffset(loadOffset + fetchedData.length);
      setHasMore(fetchedData.length === limit);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Unable to load transactions. Check your connection and permissions.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [isPlatformAdmin, institutionId, statusFilter, dateRange, searchTerm]);

  // Initial load and filter change
  useEffect(() => {
    if (transactionsProp !== undefined) return;
    // Always load transactions from Supabase
    if (!isPlatformAdmin && !institutionId) {
      setTransactions([]);
      return;
    }

    setOffset(0);
    loadTransactions(0, INITIAL_LOAD, false);
  }, [transactionsProp, isPlatformAdmin, institutionId, statusFilter, dateRange, loadTransactions]);

  // Debounced search
  useEffect(() => {
    if (transactionsProp !== undefined || (!isPlatformAdmin && !institutionId)) return;

    const timer = setTimeout(() => {
      setOffset(0);
      loadTransactions(0, INITIAL_LOAD, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, transactionsProp, isPlatformAdmin, institutionId, loadTransactions]);

  // Load more function
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore || loading) return;
    loadingRef.current = true;
    loadTransactions(offset, LOAD_MORE, true);
  }, [offset, hasMore, loading, loadTransactions]);

  // Infinite scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (loadingRef.current || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 300) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadMore]);

  const handleRowClick = (txId: string) => {
    setSelectedTransactionId(txId);
    setDrawerOpen(true);
  };

  const handleAllocationSuccess = () => {
    // Reload transactions to reflect allocation
    setOffset(0);
    loadTransactions(0, INITIAL_LOAD, false);
    // Clear selection after bulk action
    setSelectedTransactionIds(new Set());
  };

  // Real-time updates
  const { isConnected: isRealtimeConnected } = useRealtimeTransactions({
    institutionId: isPlatformAdmin ? undefined : institutionId || undefined,
    onInsert: (newTransaction) => {
      // Only add if it matches current filters
      const txDate = new Date(newTransaction.occurred_at);
      const startDate = new Date(`${dateRange.start}T00:00:00`);
      const endDate = new Date(`${dateRange.end}T23:59:59`);
      
      const matchesDateRange = txDate >= startDate && txDate <= endDate;
      const matchesStatus = statusFilter === 'all' || newTransaction.allocation_status === statusFilter;
      const matchesSearch = !searchTerm || 
        newTransaction.payer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        newTransaction.momo_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        newTransaction.payer_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (matchesDateRange && matchesStatus && matchesSearch) {
        setTransactions(prev => {
          // Check if transaction already exists (avoid duplicates)
          if (prev.some(tx => tx.id === newTransaction.id)) {
            return prev;
          }
          // Insert at the beginning (most recent first)
          return [newTransaction, ...prev];
        });
      }
    },
    onUpdate: (updatedTransaction) => {
      setTransactions(prev => {
        const index = prev.findIndex(tx => tx.id === updatedTransaction.id);
        if (index === -1) return prev;
        
        // Check if updated transaction still matches filters
        const txDate = new Date(updatedTransaction.occurred_at);
        const startDate = new Date(`${dateRange.start}T00:00:00`);
        const endDate = new Date(`${dateRange.end}T23:59:59`);
        
        const matchesDateRange = txDate >= startDate && txDate <= endDate;
        const matchesStatus = statusFilter === 'all' || updatedTransaction.allocation_status === statusFilter;
        const matchesSearch = !searchTerm || 
          updatedTransaction.payer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          updatedTransaction.momo_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          updatedTransaction.payer_name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (matchesDateRange && matchesStatus && matchesSearch) {
          // Update in place
          const updated = [...prev];
          updated[index] = updatedTransaction;
          return updated;
        } else {
          // Remove if no longer matches filters
          return prev.filter(tx => tx.id !== updatedTransaction.id);
        }
      });
    },
    onDelete: (deletedTransaction) => {
      setTransactions(prev => prev.filter(tx => tx.id !== deletedTransaction.id));
      setSelectedTransactionIds(prev => {
        const next = new Set(prev);
        next.delete(deletedTransaction.id);
        return next;
      });
    },
    enabled: !transactionsProp && (isPlatformAdmin || !!institutionId),
  });

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

  // Mock data handling
  if (transactionsProp) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Ledger (Mock Data)</h2>
        <p className="text-slate-500">Using mock data mode</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
      {error && <ErrorDisplay error={error} variant="banner" />}
      
      {/* Header with filters */}
      <div className="p-4 border-b border-slate-100 space-y-4">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800">Transactions Ledger</h2>
              {isRealtimeConnected && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <Radio size={10} className="fill-current" />
                  Live
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{transactions.length} transactions loaded</p>
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
                  exportTransactions(transactions.map(tx => ({
                    ...tx,
                    members: undefined,
                    groups: undefined,
                  })), {
                    filename: `transactions_${dateRange.start}_to_${dateRange.end}.csv`,
                  });
                } catch (err) {
                  console.error('Export failed:', err);
                  setError('Failed to export transactions');
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
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
            <TransactionSkeleton count={10} variant="table" />
          ) : (
            <TransactionSkeleton count={5} variant="card" />
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
                className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all ${
                  selectedTransactionIds.has(tx.id)
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
