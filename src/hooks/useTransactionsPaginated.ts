/**
 * Custom hook for paginated transaction data management with React Query
 * 
 * Provides infinite scrolling capabilities for the transactions list
 * Uses React Query's useInfiniteQuery for efficient caching and fetching
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as transactionsApi from '../lib/api/transactions.api';
import { queryKeys } from '../lib/query-client';
import type { SupabaseTransaction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { handleError, getUserFriendlyMessage } from '../lib/errors/ErrorHandler';

import { isSuperAdmin } from '../lib/utils/roleHelpers';

export interface UseTransactionsPaginatedOptions {
    memberId?: string;
    groupId?: string;
    status?: string; // payment status: COMPLETED, PENDING, etc.
    allocationStatus?: string; // allocated vs unallocated
    limit?: number;
    autoFetch?: boolean;
    dateRange?: { start: string; end: string };
    searchTerm?: string;
}

export interface UseTransactionsPaginatedReturn {
    transactions: Array<SupabaseTransaction & { members?: { full_name?: string | null } }>;
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    refetch: () => Promise<void>;
    loadMore: () => Promise<void>;
    createTransaction: (params: transactionsApi.CreateTransactionParams) => Promise<SupabaseTransaction>;
    updateTransactionStatus: (id: string, status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED') => Promise<SupabaseTransaction>;
    allocateTransaction: (transactionId: string, memberId: string, note?: string | null) => Promise<any>;
    // Additional React Query features
    isFetching: boolean;
    isRefetching: boolean;
}

const DEFAULT_LIMIT = 50;

export function useTransactionsPaginated(options: UseTransactionsPaginatedOptions = {}): UseTransactionsPaginatedReturn {
    const { institutionId, role } = useAuth();
    const isPlatformAdmin = isSuperAdmin(role);

    const {
        memberId,
        groupId,
        status,
        allocationStatus,
        limit = DEFAULT_LIMIT,
        autoFetch = true,
        dateRange,
        searchTerm
    } = options;
    const queryClient = useQueryClient();

    // Build query key based on filters
    const queryKey = queryKeys.transactions.list({
        institutionId: institutionId || (isPlatformAdmin ? 'global' : ''),
        memberId,
        groupId,
        status,
        allocationStatus,
        dateRange,
        searchTerm,
        paginated: true
    });

    // Fetch transactions using Infinite Query
    const {
        data,
        isLoading,
        isFetching,
        isRefetching,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: refetchQuery,
    } = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam = 0 }) => {
            // Allow if institutionId exists OR user is super admin
            if (!institutionId && !isPlatformAdmin) {
                return { data: [], nextPage: null };
            }

            // Build query with all filters - wrapped with timeout
            const { withTimeout } = await import('../lib/errors/ErrorHandler');
            const transactions = await withTimeout(
                transactionsApi.fetchTransactions(institutionId, {
                    memberId,
                    groupId,
                    status,
                    allocationStatus,
                    limit,
                    offset: pageParam,
                    dateRange,
                    searchTerm,
                }),
                30000, // 30 second timeout
                {
                    operation: 'fetchTransactionsPaginated',
                    component: 'useTransactionsPaginated',
                    institutionId: institutionId || 'global',
                }
            );

            return {
                data: transactions,
                // If we got fewer items than the limit, we've reached the end
                nextPage: transactions.length < limit ? null : pageParam + limit,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: autoFetch && (!!institutionId || isPlatformAdmin),
        initialPageParam: 0,
        // Keep previous data while fetching new data (smooth transitions)
        placeholderData: (previousData) => previousData,
        staleTime: 1000 * 30, // 30 seconds
    });

    // Flatten pages into single array
    const transactions = data?.pages.flatMap(page => page.data) || [];

    // Create transaction mutation with optimistic update (copied logic from useTransactions for consistency)
    const createMutation = useMutation({
        mutationFn: (params: transactionsApi.CreateTransactionParams) =>
            transactionsApi.createTransaction(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED' }) =>
            transactionsApi.updateTransactionStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
        },
    });

    const allocateMutation = useMutation({
        mutationFn: (params: transactionsApi.AllocateTransactionParams) =>
            transactionsApi.allocateTransaction(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
        },
    });

    const createTransaction = async (params: transactionsApi.CreateTransactionParams) => {
        return createMutation.mutateAsync(params);
    };

    const updateTransactionStatus = async (id: string, status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED') => {
        return updateStatusMutation.mutateAsync({ id, status });
    };

    const allocateTransaction = async (transactionId: string, memberId: string, note?: string | null) => {
        return allocateMutation.mutateAsync({ transaction_id: transactionId, member_id: memberId, note });
    };

    const loadMore = async () => {
        if (hasNextPage && !isFetchingNextPage) {
            await fetchNextPage();
        }
    };

    const refetch = async () => {
        await refetchQuery();
    };

    const errorMessage = error
        ? getUserFriendlyMessage(
            handleError(error, {
                operation: 'useTransactionsPaginated',
                component: 'useTransactionsPaginated',
                institutionId: institutionId || undefined,
            })
        )
        : null;

    return {
        transactions,
        loading: isLoading,
        loadingMore: isFetchingNextPage,
        error: errorMessage,
        hasMore: !!hasNextPage,
        refetch,
        loadMore,
        createTransaction,
        updateTransactionStatus,
        allocateTransaction,
        isFetching,
        isRefetching,
    };
}
