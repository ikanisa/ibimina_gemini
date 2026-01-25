/**
 * Transaction Hooks - Standardized React Query hooks
 * 
 * Uses transactionService with consistent caching and error handling.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth';
import {
    useServiceQuery,
    useServiceMutation,
    createQueryKeys,
    optimisticListUpdate,
    rollbackOptimisticUpdate,
    getQueryErrorMessage,
    CACHE_TIMES,
} from '@/core/query';
import { transactionService, type TransactionFilters } from '../services/transactionService';
import type { SupabaseTransaction } from '@/core/types';

// ============================================================================
// Query Keys
// ============================================================================

export const transactionKeys = createQueryKeys('transactions');

// ============================================================================
// Hooks
// ============================================================================

export interface UseTransactionsV2Options {
    memberId?: string;
    groupId?: string;
    status?: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
    allocationStatus?: 'unallocated' | 'allocated' | 'flagged' | 'duplicate';
    limit?: number;
    dateRange?: { start: string; end: string };
    searchTerm?: string;
    enabled?: boolean;
}

/**
 * Fetch transactions with filters
 */
export function useTransactionsV2(options: UseTransactionsV2Options = {}) {
    const { institutionId } = useAuth();
    const { enabled = true, ...filterOptions } = options;

    const filters: TransactionFilters = {
        institutionId: institutionId || '',
        ...filterOptions,
    };

    const queryKey = transactionKeys.list(filters);

    const query = useServiceQuery(
        queryKey,
        () => transactionService.getAll(filters),
        {
            enabled: enabled && !!institutionId,
            cacheTime: 'MEDIUM',
            keepPreviousData: true,
        }
    );

    return {
        transactions: query.data || [],
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error ? getQueryErrorMessage(query.error) : null,
        refetch: query.refetch,
    };
}

/**
 * Fetch a single transaction by ID
 */
export function useTransactionDetail(transactionId: string | undefined) {
    const queryKey = transactionKeys.detail(transactionId || '');

    const query = useServiceQuery(
        queryKey,
        () => transactionService.getById(transactionId!),
        {
            enabled: !!transactionId,
            cacheTime: 'MEDIUM',
        }
    );

    return {
        transaction: query.data,
        isLoading: query.isLoading,
        error: query.error ? getQueryErrorMessage(query.error) : null,
    };
}

/**
 * Create a new transaction
 */
export function useCreateTransaction() {
    const { institutionId } = useAuth();

    return useServiceMutation(
        (params: Omit<Parameters<typeof transactionService.create>[0], 'institutionId'>) =>
            transactionService.create({ ...params, institutionId: institutionId || '' }),
        {
            invalidateKeys: [transactionKeys.lists()],
            onError: (error) => {
                console.error('[Transaction] Create failed:', error.message);
            },
        }
    );
}

/**
 * Update transaction status
 */
export function useUpdateTransactionStatus() {
    const queryClient = useQueryClient();

    return useServiceMutation(
        ({ transactionId, status }: { transactionId: string; status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED' }) =>
            transactionService.updateStatus(transactionId, status),
        {
            invalidateKeys: [transactionKeys.lists()],
            onSuccess: (data) => {
                // Update detail cache if it exists
                queryClient.setQueryData(transactionKeys.detail(data.id), data);
            },
        }
    );
}

/**
 * Allocate a transaction to a member
 */
export function useAllocateTransactionV2() {
    const queryClient = useQueryClient();

    return useServiceMutation(
        (params: { transactionId: string; memberId: string; note?: string }) =>
            transactionService.allocate({
                transactionId: params.transactionId,
                memberId: params.memberId,
                note: params.note,
            }),
        {
            invalidateKeys: [transactionKeys.lists()],
            onMutate: async ({ transactionId, memberId }) => {
                // Optimistic update - mark as allocated
                await queryClient.cancelQueries({ queryKey: transactionKeys.lists() });

                // We'd need the specific query key with filters for proper optimistic update
                // For now, just invalidate on success
                return {};
            },
            onSuccess: (data) => {
                // Update detail cache
                queryClient.setQueryData(transactionKeys.detail(data.id), data);
            },
        }
    );
}

/**
 * Batch allocate transactions
 */
export function useBatchAllocateTransactions() {
    return useServiceMutation(
        (params: { transactionIds: string[]; memberId: string; groupId?: string; allocatedBy?: string }) =>
            transactionService.allocateBatch(
                params.transactionIds,
                params.memberId,
                params.groupId,
                params.allocatedBy
            ),
        {
            invalidateKeys: [transactionKeys.lists()],
        }
    );
}

/**
 * Get count of unallocated transactions
 */
export function useUnallocatedCount() {
    const { institutionId } = useAuth();

    return useServiceQuery(
        ['transactions', 'unallocated-count', institutionId],
        () => transactionService.getUnallocatedCount(institutionId || ''),
        {
            enabled: !!institutionId,
            cacheTime: 'SHORT',
        }
    );
}
