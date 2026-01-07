import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner, ErrorDisplay, EmptyState, Button, SearchInput, Badge, Modal } from './ui';
import { User, Calendar, DollarSign, Phone, MapPin, CheckCircle2, Search, Loader2 } from 'lucide-react';

interface UnallocatedTransaction {
  id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  payer_phone: string | null;
  payer_name: string | null;
  momo_ref: string | null;
  reference: string | null;
  institution_id: string;
  momo_sms_id: string | null;
  momo_sms?: {
    sms_text: string;
    parse_status: string;
  };
}

interface Member {
  id: string;
  full_name: string;
  phone: string;
  group_id: string;
  group?: {
    group_name: string;
    id: string;
  };
}

const INITIAL_LOAD = 50;
const LOAD_MORE = 25;

const AllocationQueue: React.FC = () => {
  const { institutionId } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  
  const [transactions, setTransactions] = useState<UnallocatedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<UnallocatedTransaction | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Load transactions function
  const loadTransactions = useCallback(async (loadOffset: number, limit: number, append: boolean = false) => {
    if (!institutionId) return;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          momo_sms_raw (
            sms_text,
            parse_status
          )
        `)
        .eq('institution_id', institutionId)
        .eq('allocation_status', 'unallocated')
        .order('occurred_at', { ascending: false })
        .range(loadOffset, loadOffset + limit - 1);

      if (fetchError) throw fetchError;

      const fetchedData = data as UnallocatedTransaction[];
      
      if (append) {
        setTransactions(prev => [...prev, ...fetchedData]);
      } else {
        setTransactions(fetchedData);
      }
      
      setOffset(loadOffset + fetchedData.length);
      setHasMore(fetchedData.length === limit);
    } catch (err) {
      console.error('Error loading unallocated transactions:', err);
      setError('Unable to load unallocated transactions.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [institutionId]);

  // Initial load
  useEffect(() => {
    if (!institutionId) {
      setTransactions([]);
      return;
    }
    loadTransactions(0, INITIAL_LOAD, false);
  }, [institutionId, loadTransactions]);

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

  // Load members when picker opens
  useEffect(() => {
    if (!showMemberPicker || !institutionId) return;

    const loadMembers = async () => {
      setLoadingMembers(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('members')
          .select(`
            *,
            groups (
              id,
              group_name
            )
          `)
          .eq('institution_id', institutionId)
          .eq('status', 'ACTIVE')
          .order('full_name');

        if (fetchError) throw fetchError;
        setMembers(data as Member[]);
      } catch (err) {
        console.error('Error loading members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, [showMemberPicker, institutionId]);

  // Filter transactions (client-side for already loaded data)
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter((tx) =>
      (tx.payer_phone?.toLowerCase().includes(term)) ||
      (tx.payer_name?.toLowerCase().includes(term)) ||
      (tx.reference?.toLowerCase().includes(term)) ||
      (tx.momo_ref?.toLowerCase().includes(term))
    );
  }, [transactions, searchTerm]);

  // Filter members
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const term = memberSearch.toLowerCase();
    return members.filter((m) =>
      m.full_name.toLowerCase().includes(term) ||
      m.phone.toLowerCase().includes(term)
    );
  }, [members, memberSearch]);

  const handleAllocate = async (transactionId: string, memberId: string) => {
    setAllocating(true);
    try {
      const { error: allocateError } = await supabase.rpc('allocate_transaction', {
        p_transaction_id: transactionId,
        p_member_id: memberId
      });

      if (allocateError) throw allocateError;

      // Remove transaction from list
      setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
      setShowMemberPicker(false);
      setSelectedTransaction(null);
      setMemberSearch('');
    } catch (err) {
      console.error('Error allocating transaction:', err);
      alert(err instanceof Error ? err.message : 'Failed to allocate transaction');
    } finally {
      setAllocating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && transactions.length === 0) {
    return <LoadingSpinner size="lg" text="Loading allocation queue..." className="h-64" />;
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {error && <ErrorDisplay error={error} variant="banner" />}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Allocation Queue</h2>
            <p className="text-sm text-slate-600 mt-1">
              {transactions.length} unallocated transaction{transactions.length !== 1 ? 's' : ''} loaded
            </p>
          </div>
          <SearchInput
            placeholder="Search by phone, name, or reference"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            className="w-full md:w-80"
          />
        </div>
      </div>

      {/* Transactions List with infinite scroll */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-4">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              {/* Transaction Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="text-lg font-bold text-slate-900">
                      {tx.amount.toLocaleString()} {tx.currency || 'RWF'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={14} />
                    <span>{formatDate(tx.occurred_at)}</span>
                    <span className="text-slate-400">•</span>
                    <span>{formatTime(tx.occurred_at)}</span>
                  </div>
                </div>
                <Badge variant="warning">Unallocated</Badge>
              </div>

              {/* Transaction Details */}
              <div className="space-y-2 mb-4">
                {tx.payer_phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Phone size={14} className="text-slate-400" />
                    <span className="font-mono">{tx.payer_phone}</span>
                  </div>
                )}
                {tx.payer_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <User size={14} className="text-slate-400" />
                    <span>{tx.payer_name}</span>
                  </div>
                )}
                {tx.momo_ref && (
                  <div className="text-xs text-slate-500 font-mono">
                    Ref: {tx.momo_ref}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedTransaction(tx);
                    setShowMemberPicker(true);
                  }}
                >
                  Assign to Member
                </Button>
                {tx.momo_sms_id && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      alert(tx.momo_sms?.sms_text || 'SMS text not available');
                    }}
                  >
                    View SMS
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          </div>
        )}

        {/* End of list indicator */}
        {!hasMore && transactions.length > 0 && !searchTerm && (
          <div className="py-4 text-center text-sm text-slate-400">
            All {transactions.length} transactions loaded
          </div>
        )}

        {filteredTransactions.length === 0 && !loading && (
          <EmptyState
            icon={CheckCircle2}
            title="All clear!"
            description={
              searchTerm
                ? "No unallocated transactions match your search."
                : "All transactions have been allocated. Great work!"
            }
          />
        )}
      </div>

      {/* Member Picker Modal */}
      <Modal
        isOpen={showMemberPicker}
        onClose={() => {
          setShowMemberPicker(false);
          setSelectedTransaction(null);
          setMemberSearch('');
        }}
        title="Select Member"
        size="lg"
      >
        <div className="space-y-4">
          <SearchInput
            placeholder="Search by name or phone"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            onClear={() => setMemberSearch('')}
            leftIcon={<Search size={16} />}
          />

          {loadingMembers ? (
            <LoadingSpinner size="md" text="Loading members..." />
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    if (selectedTransaction) {
                      handleAllocate(selectedTransaction.id, member.id);
                    }
                  }}
                  disabled={allocating}
                  className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{member.full_name}</div>
                      <div className="text-sm text-slate-600 font-mono mt-1">{member.phone}</div>
                      {member.group && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <MapPin size={12} />
                          <span>{member.group.group_name}</span>
                        </div>
                      )}
                    </div>
                    {allocating ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <CheckCircle2 size={20} className="text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <EmptyState
                  icon={User}
                  title="No members found"
                  description={memberSearch ? "Try a different search term." : "No active members in this institution."}
                />
              )}
            </div>
          )}

          {selectedTransaction && (
            <div className="pt-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                <strong>Allocating:</strong> {selectedTransaction.amount.toLocaleString()} {selectedTransaction.currency || 'RWF'}
                {selectedTransaction.payer_phone && (
                  <span className="ml-2">• Phone: {selectedTransaction.payer_phone}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AllocationQueue;
