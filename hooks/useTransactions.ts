/**
 * Custom hook for transaction data management with React Query
 * 
 * Provides a clean interface for components to interact with transaction data
 * Uses React Query for caching, background refetching, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as transactionsApi from '../lib/api/transactions.api';
import { queryKeys } from '../lib/query-client';
import type { SupabaseTransaction } from '../types';
import { useAuth } from '../contexts/AuthContext';

export interface UseTransactionsOptions {
  memberId?: string;
  groupId?: string;
  status?: string;
  limit?: number;
  autoFetch?: boolean;
  dateRange?: { start: string; end: string };
  searchTerm?: string;
}

export interface UseTransactionsReturn {
  transactions: Array<SupabaseTransaction & { members?: { full_name?: string | null } }>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTransaction: (params: transactionsApi.CreateTransactionParams) => Promise<SupabaseTransaction>;
  updateTransactionStatus: (id: string, status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED') => Promise<SupabaseTransaction>;
  // Additional React Query features
  isFetching: boolean;
  isRefetching: boolean;
}

export function useTransactions(options: UseTransactionsOptions = {}): UseTransactionsReturn {
  const { institutionId } = useAuth();
  const { memberId, groupId, status, limit, autoFetch = true, dateRange, searchTerm } = options;
  const queryClient = useQueryClient();

  // Build query key based on filters
  const queryKey = queryKeys.transactions.list({
    institutionId: institutionId || '',
    memberId,
    groupId,
    status,
    dateRange,
    searchTerm,
  });

  // Fetch transactions using React Query
  const {
    data: transactions = [],
    isLoading,
    isFetching,
    isRefetching,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!institutionId) {
        return [];
      }

      // Build query with all filters
      return transactionsApi.fetchTransactions(institutionId, {
        memberId,
        groupId,
        status,
        allocationStatus: status, // Support both status and allocation_status
        limit,
        dateRange,
        searchTerm,
      });
    },
    enabled: autoFetch && !!institutionId,
    // Keep previous data while fetching new data (smooth transitions)
    placeholderData: (previousData) => previousData,
  });

  // Create transaction mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: (params: transactionsApi.CreateTransactionParams) =>
      transactionsApi.createTransaction(params),
    onSuccess: (newTransaction) => {
      // Invalidate and refetch transactions list
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      
      // Optionally update the cache optimistically
      queryClient.setQueryData<Array<SupabaseTransaction & { members?: { full_name?: string | null } }>>(
        queryKey,
        (old) => {
          if (!old) return [newTransaction];
          return [newTransaction, ...old];
        }
      );
    },
  });

  // Update transaction status mutation with optimistic update
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED' }) =>
      transactionsApi.updateTransactionStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousTransactions = queryClient.getQueryData<Array<SupabaseTransaction & { members?: { full_name?: string | null } }>>(queryKey);

      // Optimistically update
      queryClient.setQueryData<Array<SupabaseTransaction & { members?: { full_name?: string | null } }>>(
        queryKey,
        (old) => {
          if (!old) return old;
          return old.map((t) => (t.id === id ? { ...t, status } : t));
        }
      );

      // Return context with snapshot
      return { previousTransactions };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKey, context.previousTransactions);
      }
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
    },
  });

  // Allocate transaction mutation with optimistic update
  const allocateMutation = useMutation({
    mutationFn: (params: transactionsApi.AllocateTransactionParams) =>
      transactionsApi.allocateTransaction(params),
    onMutate: async ({ transaction_id, member_id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousTransactions = queryClient.getQueryData<Array<SupabaseTransaction & { members?: { full_name?: string | null } }>>(queryKey);

      // Optimistically update - mark transaction as allocated
      queryClient.setQueryData<Array<SupabaseTransaction & { members?: { full_name?: string | null } }>>(
        queryKey,
        (old) => {
          if (!old) return old;
          return old.map((t) => 
            t.id === transaction_id 
              ? { 
                  ...t, 
                  member_id,
                  allocation_status: 'allocated',
                  allocated_at: new Date().toISOString(),
                } 
              : t
          );
        }
      );

      return { previousTransactions };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKey, context.previousTransactions);
      }
    },
    onSuccess: (updatedTransaction) => {
      // Update cache with server response
      queryClient.setQueryData<Array<SupabaseTransaction & { members?: { full_name?: string | null } }>>(
        queryKey,
        (old) => {
          if (!old) return old;
          return old.map((t) => t.id === updatedTransaction.id ? updatedTransaction : t);
        }
      );
      
      // Invalidate to ensure consistency
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

  const refetch = async () => {
    await refetchQuery();
  };

  return {
    transactions,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch transactions') : null,
    refetch,
    createTransaction,
    updateTransactionStatus,
    allocateTransaction,
    isFetching,
    isRefetching,
  };
}
