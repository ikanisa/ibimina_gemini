import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth';
import { handleError } from '@/lib/errors/ErrorHandler';
import { queryKeys } from '@/lib/query-client';

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
    const { institutionId, user } = useAuth();
    const queryClient = useQueryClient();

    const allocateMutation = useMutation({
        mutationFn: async ({ transactionId, memberId, note }: AllocateTransactionParams) => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase.rpc('allocate_transaction', {
                p_transaction_id: transactionId,
                p_member_id: memberId,
                p_note: note || null
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
            queryClient.invalidateQueries({ queryKey: ['member_balances'] }); // If we have this key
            queryClient.invalidateQueries({ queryKey: ['audit_log'] });
        },
        onError: (error) => {
            handleError(error, 'useAllocateTransaction.allocate');
        }
    });

    const bulkAllocateMutation = useMutation({
        mutationFn: async ({ transactionIds, memberId, note }: BulkAllocateParams) => {
            if (!user) throw new Error('User not authenticated');

            // Loop through transactions and allocate individually to ensure proper audit logging via RPC
            // The RPC handles validations and audit logging per transaction
            const promises = transactionIds.map(id =>
                supabase.rpc('allocate_transaction', {
                    p_transaction_id: id,
                    p_member_id: memberId,
                    p_note: note || null
                })
            );

            const results = await Promise.all(promises);

            // Check for errors
            const errors = results.filter(r => r.error);
            if (errors.length > 0) {
                throw new Error(`Failed to allocate ${errors.length} transactions`);
            }

            return results.map(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
        },
        onError: (error) => {
            handleError(error, 'useAllocateTransaction.bulkAllocate');
        }
    });

    const flagDuplicateMutation = useMutation({
        mutationFn: async ({ transactionId, originalTransactionId }: { transactionId: string, originalTransactionId?: string }) => {
            const { data, error } = await supabase
                .from('transactions')
                .update({
                    allocation_status: 'duplicate',
                    // Optionally link to original if we add a column for it, but for now just status
                    allocation_note: originalTransactionId ? `Duplicate of ${originalTransactionId}` : 'Flagged as duplicate'
                })
                .eq('id', transactionId)
                .select()
                .single();

            if (error) throw error;

            // Create audit log manually since we aren't using the RPC
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
