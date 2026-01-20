import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, DollarSign, Phone, Hash, FileText, CheckCircle2, Search, AlertCircle, MapPin, Clock, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth';
import { Button, Badge, SearchInput, LoadingSpinner, EmptyState } from '@/shared/components/ui';
import { drawerSlide, transitions } from '@/lib/animations/framer-motion';
import { useTransactions } from '@/hooks/useTransactions';
import { DragDropAllocation, DraggableTransaction } from './DragDropAllocation';
import { transactionService } from '../services/transactionService';

interface TransactionDetails {
  id: string;
  institution_id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  payer_phone: string | null;
  payer_name: string | null;
  momo_ref: string | null;
  reference: string | null;
  allocation_status: string;
  member_id: string | null;
  group_id: string | null;
  allocated_by: string | null;
  allocated_at: string | null;
  allocation_note: string | null;
  parse_confidence: number | null;
  type: string;
  channel: string;
  status: string;
}

interface SourceSms {
  id: string;
  sms_text: string;
  sender_phone: string;
  received_at: string;
  parse_status: string;
  parse_error: string | null;
}

interface Member {
  id: string;
  full_name: string;
  phone: string;
  member_code: string | null;
  group_id: string;
  institution_id: string;
}

interface Group {
  id: string;
  name: string;
}

interface AllocationHistory {
  id: string;
  member_id: string;
  group_id: string;
  allocated_at: string;
  notes: string | null;
  allocated_by: string;
}

interface AllocatedByUser {
  id: string;
  email: string;
  full_name: string;
}

interface TransactionDrawerProps {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAllocationSuccess: () => void;
}

const TransactionDrawer: React.FC<TransactionDrawerProps> = ({
  transactionId,
  isOpen,
  onClose,
  onAllocationSuccess
}) => {
  const { institutionId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [sourceSms, setSourceSms] = useState<SourceSms | null>(null);
  const [allocations, setAllocations] = useState<AllocationHistory[]>([]);
  const [allocatedByUser, setAllocatedByUser] = useState<AllocatedByUser | null>(null);

  // Suggested member state (phone-based match)
  const [suggestedMember, setSuggestedMember] = useState<{
    id: string;
    full_name: string;
    phone: string;
    savings_balance: number;
    group_id: string | null;
    group_name: string | null;
  } | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // Allocation state
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [members, setMembers] = useState<(Member & { group?: Group })[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [allocationNote, setAllocationNote] = useState('');

  // Load transaction details
  useEffect(() => {
    if (!transactionId || !isOpen) return;

    const loadDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_transaction_details', {
          p_transaction_id: transactionId
        });

        if (error) throw error;

        if (data) {
          setTransaction(data.transaction);
          setMember(data.member);
          setGroup(data.group);
          setSourceSms(data.source_sms);
          setAllocations(data.allocations || []);
          setAllocatedByUser(data.allocated_by_user);
        }
      } catch (err) {
        console.error('Error loading transaction details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [transactionId, isOpen]);

  // Load suggested member for unallocated transactions
  useEffect(() => {
    if (!transactionId || !isOpen || !transaction) return;
    if (transaction.allocation_status !== 'unallocated') {
      setSuggestedMember(null);
      return;
    }

    const loadSuggestion = async () => {
      setLoadingSuggestion(true);
      try {
        const result = await transactionService.getSuggestedMember(transactionId);
        setSuggestedMember(result.suggestedMember);
      } catch (err) {
        console.error('Error loading suggested member:', err);
        setSuggestedMember(null);
      } finally {
        setLoadingSuggestion(false);
      }
    };

    loadSuggestion();
  }, [transactionId, isOpen, transaction?.allocation_status]);

  // Load members for allocation
  useEffect(() => {
    if (!showMemberSearch || !institutionId) return;

    const loadMembers = async () => {
      setLoadingMembers(true);
      try {
        const { data, error } = await supabase
          .from('members')
          .select(`
            *,
            groups (id, name)
          `)
          .eq('institution_id', institutionId)
          .eq('status', 'ACTIVE')
          .order('full_name');

        if (error) throw error;
        setMembers(data as (Member & { group?: Group })[]);
      } catch (err) {
        console.error('Error loading members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, [showMemberSearch, institutionId]);

  // Filter members
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const term = memberSearch.toLowerCase();
    return members.filter((m) =>
      m.full_name.toLowerCase().includes(term) ||
      m.phone.toLowerCase().includes(term) ||
      m.member_code?.toLowerCase().includes(term)
    );
  }, [members, memberSearch]);

  const handleAllocate = async (memberId: string) => {
    if (!transactionId) return;

    setAllocating(true);
    try {
      const { data, error } = await supabase.rpc('allocate_transaction', {
        p_transaction_id: transactionId,
        p_member_id: memberId,
        p_note: allocationNote || null
      });

      if (error) throw error;

      // Reload details
      const { data: refreshed } = await supabase.rpc('get_transaction_details', {
        p_transaction_id: transactionId
      });

      if (refreshed) {
        setTransaction(refreshed.transaction);
        setMember(refreshed.member);
        setGroup(refreshed.group);
        setAllocations(refreshed.allocations || []);
        setAllocatedByUser(refreshed.allocated_by_user);
      }

      setShowMemberSearch(false);
      setMemberSearch('');
      setAllocationNote('');
      onAllocationSuccess();
    } catch (err) {
      console.error('Error allocating transaction:', err);
      alert(err instanceof Error ? err.message : 'Failed to allocate transaction');
    } finally {
      setAllocating(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.normal}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-neutral-800 shadow-xl z-50 flex flex-col"
            variants={drawerSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.spring}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-neutral-100">Transaction Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500 dark:text-neutral-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <LoadingSpinner size="lg" text="Loading details..." className="h-64" />
              ) : transaction ? (
                <div className="p-6 space-y-6">
                  {/* Summary Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Summary</h3>

                    {/* Amount */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-neutral-900 rounded-xl">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                        <DollarSign size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100">
                          {transaction.amount.toLocaleString()} {transaction.currency || 'RWF'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-neutral-400">{transaction.type} via {transaction.channel}</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Calendar size={16} className="text-slate-400 dark:text-neutral-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-neutral-400">Date & Time</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-neutral-100">
                            {formatDateTime(transaction.occurred_at)}
                          </p>
                        </div>
                      </div>

                      {transaction.payer_phone && (
                        <div className="flex items-start gap-2">
                          <Phone size={16} className="text-slate-400 dark:text-neutral-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400">Payer Phone</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-neutral-100 font-mono">
                              {transaction.payer_phone}
                            </p>
                          </div>
                        </div>
                      )}

                      {transaction.payer_name && (
                        <div className="flex items-start gap-2">
                          <User size={16} className="text-slate-400 dark:text-neutral-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400">Payer Name</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-neutral-100">
                              {transaction.payer_name}
                            </p>
                          </div>
                        </div>
                      )}

                      {transaction.momo_ref && (
                        <div className="flex items-start gap-2">
                          <Hash size={16} className="text-slate-400 dark:text-neutral-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400">MoMo Reference</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-neutral-100 font-mono">
                              {transaction.momo_ref}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500 dark:text-neutral-400">Status:</span>
                      <Badge variant={
                        transaction.allocation_status === 'allocated' ? 'success' :
                          transaction.allocation_status === 'unallocated' ? 'warning' :
                            'danger'
                      }>
                        {transaction.allocation_status}
                      </Badge>
                      {transaction.parse_confidence !== null && (
                        <span className="text-xs text-slate-400 dark:text-neutral-500">
                          ({Math.round(transaction.parse_confidence * 100)}% confidence)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Allocation Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Allocation</h3>

                    {transaction.allocation_status === 'unallocated' ? (
                      <div className="space-y-3">
                        {/* Suggested Member Card */}
                        {loadingSuggestion ? (
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 animate-pulse">
                            <div className="flex items-center gap-2">
                              <Loader2 size={16} className="animate-spin text-purple-600 dark:text-purple-400" />
                              <span className="text-sm text-purple-700 dark:text-purple-300">Finding matching member...</span>
                            </div>
                          </div>
                        ) : suggestedMember ? (
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                              <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">Suggested Match (Phone)</span>
                            </div>
                            <button
                              onClick={() => handleAllocate(suggestedMember.id)}
                              disabled={allocating}
                              className="w-full text-left p-3 bg-white dark:bg-neutral-800 rounded-lg border-2 border-purple-300 dark:border-purple-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-neutral-100">{suggestedMember.full_name}</p>
                                  <p className="text-sm text-slate-600 dark:text-neutral-400 font-mono">{suggestedMember.phone}</p>
                                  {suggestedMember.group_name && (
                                    <p className="text-xs text-slate-500 dark:text-neutral-500 flex items-center gap-1 mt-1">
                                      <MapPin size={10} />
                                      {suggestedMember.group_name}
                                    </p>
                                  )}
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    Balance: {suggestedMember.savings_balance?.toLocaleString() || 0} RWF
                                  </p>
                                </div>
                                {allocating ? (
                                  <Loader2 size={18} className="animate-spin text-purple-600 dark:text-purple-400" />
                                ) : (
                                  <CheckCircle2 size={18} className="text-purple-600 dark:text-purple-400" />
                                )}
                              </div>
                            </button>
                          </div>
                        ) : null}

                        {!showMemberSearch ? (
                          <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => setShowMemberSearch(true)}
                            leftIcon={<User size={16} />}
                          >
                            {suggestedMember ? 'Search Other Members' : 'Allocate to Member'}
                          </Button>
                        ) : (
                          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <SearchInput
                              placeholder="Search by name, phone, or code"
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              onClear={() => setMemberSearch('')}
                            />

                            {/* Optional note */}
                            <div>
                              <label className="text-xs text-slate-600 dark:text-neutral-400 mb-1 block">Note (optional)</label>
                              <input
                                type="text"
                                value={allocationNote}
                                onChange={(e) => setAllocationNote(e.target.value)}
                                placeholder="e.g., Phone mismatch verified"
                                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            {loadingMembers ? (
                              <LoadingSpinner size="sm" text="Loading members..." />
                            ) : (
                              <div className="max-h-60 overflow-y-auto space-y-2">
                                {filteredMembers.map((m) => (
                                  <button
                                    key={m.id}
                                    onClick={() => handleAllocate(m.id)}
                                    disabled={allocating}
                                    className="w-full text-left p-3 bg-white dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-600 hover:border-blue-500 hover:bg-white dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-semibold text-slate-900 dark:text-neutral-100">{m.full_name}</p>
                                        <p className="text-sm text-slate-600 dark:text-neutral-400 font-mono">{m.phone}</p>
                                        {m.group && (
                                          <p className="text-xs text-slate-500 dark:text-neutral-500 flex items-center gap-1 mt-1">
                                            <MapPin size={10} />
                                            {m.group.name}
                                          </p>
                                        )}

                                      </div>
                                      {allocating ? (
                                        <Loader2 size={18} className="animate-spin text-blue-600 dark:text-blue-400" />
                                      ) : (
                                        <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400" />
                                      )}
                                    </div>
                                  </button>
                                ))}
                                {filteredMembers.length === 0 && (
                                  <p className="text-sm text-slate-500 dark:text-neutral-400 text-center py-4">
                                    No members found
                                  </p>
                                )}
                              </div>
                            )}

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setShowMemberSearch(false);
                                setMemberSearch('');
                                setAllocationNote('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-green-900 dark:text-green-300">Allocated</p>
                            {member && (
                              <p className="text-sm text-green-800 dark:text-green-400 mt-1">
                                <span className="font-medium">{member.full_name}</span>
                                <span className="text-green-600 dark:text-green-500"> ({member.phone})</span>
                              </p>
                            )}
                            {group && (
                              <p className="text-xs text-green-700 dark:text-green-500 mt-0.5">
                                Group: {group.name}
                              </p>
                            )}
                            {transaction.allocated_at && (
                              <p className="text-xs text-green-600 dark:text-green-500 mt-2 flex items-center gap-1">
                                <Clock size={12} />
                                {formatDateTime(transaction.allocated_at)}
                                {allocatedByUser && ` by ${allocatedByUser.full_name || allocatedByUser.email}`}
                              </p>
                            )}
                            {transaction.allocation_note && (
                              <p className="text-xs text-green-700 dark:text-green-500 mt-1 italic">
                                "{transaction.allocation_note}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Source SMS Section */}
                  {sourceSms && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Source SMS</h3>
                      <div className="p-4 bg-slate-50 dark:bg-neutral-900 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare size={16} className="text-slate-400 dark:text-neutral-500" />
                          <span className="text-xs text-slate-500 dark:text-neutral-400">
                            From: {sourceSms.sender_phone} • {formatDateTime(sourceSms.received_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-neutral-300 font-mono bg-white dark:bg-neutral-800 p-3 rounded-lg border border-slate-200 dark:border-neutral-700 whitespace-pre-wrap">
                          {sourceSms.sms_text}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant={sourceSms.parse_status === 'parsed' ? 'success' : 'warning'}>
                            {sourceSms.parse_status}
                          </Badge>
                          {sourceSms.parse_error && (
                            <span className="text-xs text-red-600 dark:text-red-400">{sourceSms.parse_error}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audit Trail Section */}
                  {allocations.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Audit Trail</h3>
                      <div className="space-y-2">
                        {allocations.map((a) => (
                          <div key={a.id} className="p-3 bg-slate-50 dark:bg-neutral-900 rounded-lg text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-900 dark:text-neutral-100">Allocated</span>
                              <span className="text-xs text-slate-500 dark:text-neutral-400">{formatDateTime(a.allocated_at)}</span>
                            </div>
                            {a.notes && (
                              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 italic">"{a.notes}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="Transaction not found"
                  description="This transaction could not be loaded."
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TransactionDrawer;

