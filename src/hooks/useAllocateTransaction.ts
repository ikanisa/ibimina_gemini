/**
 * Custom hook for transaction allocation
 * 
 * Uses transactionService for all data access.
 * 
 * @deprecated Consider using useAllocateTransactionV2 from '@/features/transactions' for new code
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/features/transactions/services/transactionService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { handleError } from '../lib/errors/ErrorHandler';
import { queryKeys } from '../lib/query-client';

export interface AllocateTransactionParams {
    transactionId: string;
    memberId: string;
    note?: string;
}

export interface BulkAllocateParams {
    transactionIds: string[];
    memberId: string;
    note?: string;
}

export function useAllocateTransaction() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Single allocation - using transactionService
    const allocateMutation = useMutation({
        mutationFn: async ({ transactionId, memberId, note }: AllocateTransactionParams) => {
            if (!user) throw new Error('User not authenticated');

            return transactionService.allocate({
                transactionId,
                memberId,
                note,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
            queryClient.invalidateQueries({ queryKey: ['member_balances'] });
            queryClient.invalidateQueries({ queryKey: ['audit_log'] });
        },
        onError: (error) => {
            handleError(error, 'useAllocateTransaction.allocate');
        }
    });

    // Bulk allocation - using transactionService.allocateBatch
    const bulkAllocateMutation = useMutation({
        mutationFn: async ({ transactionIds, memberId, note }: BulkAllocateParams) => {
            if (!user) throw new Error('User not authenticated');

            return transactionService.allocateBatch({
                transactionIds,
                memberId,
                note,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
        },
        onError: (error) => {
            handleError(error, 'useAllocateTransaction.bulkAllocate');
        }
    });

    // Flag duplicate - using direct Supabase (no service method for this yet)
    const flagDuplicateMutation = useMutation({
        mutationFn: async ({ transactionId, originalTransactionId }: { transactionId: string, originalTransactionId?: string }) => {
            const { data, error } = await supabase
                .from('transactions')
                .update({
                    allocation_status: 'duplicate',
                    allocation_note: originalTransactionId ? `Duplicate of ${originalTransactionId}` : 'Flagged as duplicate'
                })
                .eq('id', transactionId)
                .select()
                .single();

            if (error) throw error;

            // Create audit log manually
            await supabase.from('audit_log').insert({
                institution_id: data.institution_id,
                action: 'transaction_flagged_duplicate',
                entity_type: 'transaction',
                entity_id: transactionId,
                actor_user_id: user?.id,
                details: {
                    original_transaction_id: originalTransactionId
                }
            });

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
        }
    });

    return {
        allocate: allocateMutation.mutateAsync,
        isAllocating: allocateMutation.isPending,
        bulkAllocate: bulkAllocateMutation.mutateAsync,
        isBulkAllocating: bulkAllocateMutation.isPending,
        flagDuplicate: flagDuplicateMutation.mutateAsync,
        isFlagging: flagDuplicateMutation.isPending
    };
}
