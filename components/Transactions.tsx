import React, { useEffect, useState, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { Transaction, ViewState } from '../types';
import { Download, Filter, ExternalLink, FileText, Loader2, Calendar, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { mapTransactionStatus, mapTransactionType, mapTransactionChannel } from '../lib/mappers';
import { LoadingSpinner, ErrorDisplay, EmptyState, Button, SearchInput, Badge } from './ui';

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
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const { institutionId } = useAuth();
  const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

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
    if (!institutionId) return;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let query = supabase
        .from('transactions')
        .select('*, members(full_name), groups(name)')
        .eq('institution_id', institutionId)
        .gte('occurred_at', `${dateRange.start}T00:00:00`)
        .lte('occurred_at', `${dateRange.end}T23:59:59`)
        .order('occurred_at', { ascending: false });

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

      const fetchedData = data as SupabaseTransaction[];

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
  }, [institutionId, statusFilter, dateRange, searchTerm]);

  // Initial load and filter change
  useEffect(() => {
    if (transactionsProp !== undefined) return;
    if (useMockData) return;
    if (!institutionId) {
      setTransactions([]);
      return;
    }

    setOffset(0);
    loadTransactions(0, INITIAL_LOAD, false);
  }, [transactionsProp, useMockData, institutionId, statusFilter, dateRange, loadTransactions]);

  // Debounced search
  useEffect(() => {
    if (transactionsProp !== undefined || useMockData || !institutionId) return;

    const timer = setTimeout(() => {
      setOffset(0);
      loadTransactions(0, INITIAL_LOAD, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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
  };

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
            <h2 className="text-lg font-semibold text-slate-800">Transactions Ledger</h2>
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
            <Button variant="secondary" size="sm" leftIcon={<Download size={16} />}>
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

      {/* Table with infinite scroll */}
      {loading && transactions.length === 0 ? (
        <LoadingSpinner size="lg" text="Loading transactions..." className="h-64" />
      ) : (
        <div ref={containerRef} className="flex-1 overflow-y-auto">
          {/* Desktop Table */}
          <table className="w-full text-left hidden md:table">
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
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => handleRowClick(tx.id)}
                  className="hover:bg-slate-50 active:bg-slate-100 transition-all duration-150 cursor-pointer"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-medium">{formatDate(tx.occurred_at)}</div>
                    <div className="text-xs text-slate-400">{formatTime(tx.occurred_at)}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">
                      {tx.amount.toLocaleString()} {tx.currency || 'RWF'}
                    </div>
                    <div className="text-xs text-slate-400">{tx.channel}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {tx.payer_name || tx.payer_phone || '—'}
                    </div>
                    {tx.payer_name && tx.payer_phone && (
                      <div className="text-xs text-slate-400 font-mono">{tx.payer_phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-slate-600 font-mono max-w-[120px] truncate">
                      {tx.momo_ref || tx.reference || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(tx.allocation_status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
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
                  </td>
                </tr>
              ))}
              
              {/* Loading more indicator */}
              {loadingMore && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">Loading more...</span>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* End of list indicator */}
              {!hasMore && transactions.length > 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-sm text-slate-400">
                    All {transactions.length} transactions loaded
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => handleRowClick(tx.id)}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
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
