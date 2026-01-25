import React, { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useAllocateTransaction } from '@/hooks/useAllocateTransaction';
import { Button, Badge, LoadingSpinner, EmptyState } from '@/shared/components/ui';
import { AllocationModal } from './AllocationModal';
import { Flag, AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

export const UnallocatedQueue: React.FC = () => {
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

    const {
        transactions,
        loading,
        error,
        refetch
    } = useTransactions({
        status: 'unallocated',
        limit: 50,
        autoFetch: true
    });

    const { flagDuplicate } = useAllocateTransaction();

    const handleAllocateClick = (transactionId: string) => {
        setSelectedTransactionId(transactionId);
        setIsAllocationModalOpen(true);
    };

    const handleFlagDuplicate = async (transactionId: string) => {
        if (window.confirm('Are you sure you want to flag this transaction as a duplicate?')) {
            await flagDuplicate({ transactionId });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <AlertTriangle size={20} />
                <span>Failed to load unallocated transactions: {error}</span>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <EmptyState
                icon={CheckCircle}
                title="All Caught Up!"
                description="There are no unallocated transactions needing attention."
            />
        );
    }

    const selectedTransaction = transactions.find(t => t.id === selectedTransactionId);

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        Unallocated Queue
                        <Badge variant="warning">{transactions.length}</Badge>
                    </h3>
                    <div className="text-sm text-slate-500">
                        Oldest transactions first
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-900">
                                            {formatCurrency(tx.amount, tx.currency)}
                                        </span>
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className="text-sm text-slate-600">
                                            {new Date(tx.occurred_at).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="text-sm text-slate-700 font-medium">
                                        {tx.payer_name || tx.payer_phone || 'Unknown Payer'}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {tx.momo_ref && (
                                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                Ref: {tx.momo_ref}
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                            {tx.channel}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleFlagDuplicate(tx.id)}
                                        className="text-slate-600 hover:text-red-600 hover:border-red-200"
                                        title="Flag as duplicate"
                                    >
                                        <Flag size={16} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleAllocateClick(tx.id)}
                                    >
                                        Allocate
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedTransaction && (
                <AllocationModal
                    isOpen={isAllocationModalOpen}
                    onClose={() => setIsAllocationModalOpen(false)}
                    transactionId={selectedTransaction.id}
                    amount={selectedTransaction.amount}
                    currency={selectedTransaction.currency}
                    onSuccess={() => {
                        // Optimistic update handled by React Query, but we can refetch to be sure
                        refetch();
                    }}
                />
            )}
        </div>
    );
};
