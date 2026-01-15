/**
 * Transaction Approval Workflow Component
 * Handles pending transaction approvals for managers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Loader,
    Filter,
    ChevronDown,
    User,
    DollarSign,
    Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface PendingTransaction {
    id: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'transfer';
    status: ApprovalStatus;
    member_name: string;
    member_id: string;
    created_at: string;
    created_by: string;
    notes: string | null;
    requires_approval: boolean;
}

interface ApprovalWorkflowProps {
    institutionId: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({ institutionId }) => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [filter, setFilter] = useState<ApprovalStatus | 'all'>('pending');
    const [error, setError] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('transactions')
                .select(`
          id,
          amount,
          type,
          status,
          created_at,
          created_by,
          notes,
          requires_approval,
          member:members!transactions_member_id_fkey(id, full_name)
        `)
                .eq('requires_approval', true)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            const formatted = (data || []).map((t: any) => ({
                ...t,
                member_name: t.member?.full_name || 'Unknown',
                member_id: t.member?.id || '',
            }));

            setTransactions(formatted);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load transactions');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const handleApprove = async (transactionId: string) => {
        if (!user) return;

        setProcessing(transactionId);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('transactions')
                .update({
                    status: 'approved',
                    approved_by: user.id,
                    approved_at: new Date().toISOString(),
                })
                .eq('id', transactionId);

            if (updateError) throw updateError;

            // Update local state
            setTransactions((prev) =>
                prev.map((t) =>
                    t.id === transactionId ? { ...t, status: 'approved' as ApprovalStatus } : t
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve transaction');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        if (!showRejectModal || !user) return;

        setProcessing(showRejectModal);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('transactions')
                .update({
                    status: 'rejected',
                    rejected_by: user.id,
                    rejected_at: new Date().toISOString(),
                    rejection_reason: rejectReason,
                })
                .eq('id', showRejectModal);

            if (updateError) throw updateError;

            setTransactions((prev) =>
                prev.map((t) =>
                    t.id === showRejectModal ? { ...t, status: 'rejected' as ApprovalStatus } : t
                )
            );
            setShowRejectModal(null);
            setRejectReason('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject transaction');
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (status: ApprovalStatus) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        const icons = {
            pending: Clock,
            approved: CheckCircle,
            rejected: XCircle,
        };
        const Icon = icons[status];

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                <Icon size={12} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('rw-RW', { style: 'currency', currency: 'RWF' }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader size={24} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Transaction Approvals</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Review and approve pending transactions
                    </p>
                </div>

                {/* Filter */}
                <div className="relative">
                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as ApprovalStatus | 'all')}
                        className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Transactions</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertTriangle size={20} />
                    {error}
                </div>
            )}

            {/* Transaction List */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {transactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Clock size={48} className="mx-auto mb-4 text-slate-300" />
                        <p>No transactions to review</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="p-4 hover:bg-slate-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <DollarSign size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-slate-900">
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                                {getStatusBadge(transaction.status)}
                                            </div>
                                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                <User size={14} />
                                                {transaction.member_name}
                                            </p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                                <Calendar size={12} />
                                                {new Date(transaction.created_at).toLocaleString()}
                                            </p>
                                            {transaction.notes && (
                                                <p className="text-sm text-slate-600 mt-2 italic">
                                                    "{transaction.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {transaction.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleApprove(transaction.id)}
                                                disabled={processing === transaction.id}
                                                className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {processing === transaction.id ? (
                                                    <Loader size={14} className="animate-spin" />
                                                ) : (
                                                    <CheckCircle size={14} />
                                                )}
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setShowRejectModal(transaction.id)}
                                                disabled={processing === transaction.id}
                                                className="inline-flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                                            >
                                                <XCircle size={14} />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                            Reject Transaction
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Reason for rejection
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Enter reason..."
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowRejectModal(null);
                                    setRejectReason('');
                                }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || processing !== null}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                Reject Transaction
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalWorkflow;
