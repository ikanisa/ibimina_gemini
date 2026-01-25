/**
 * Custom hook for transaction data management with React Query
 * 
 * Provides a clean interface for components to interact with transaction data
 * Uses React Query for caching, background refetching, and optimistic updates
 * 
 * @deprecated Consider using useTransactionsV2 from '@/features/transactions' for new code
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/features/transactions/services/transactionService';
import { queryKeys } from '../lib/query-client';
import type { SupabaseTransaction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getUserFriendlyMessage, createAppError } from '@/core/errors';

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
  createTransaction: (params: {
    institution_id: string;
    member_id?: string;
    group_id?: string;
    type: string;
    amount: number;
    currency?: string;
    channel: string;
    status?: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
    reference?: string;
  }) => Promise<SupabaseTransaction>;
  updateTransactionStatus: (id: string, status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED') => Promise<SupabaseTransaction>;
  allocateTransaction: (transactionId: string, memberId: string, note?: string | null) => Promise<any>;
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

  // Fetch transactions using transactionService
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

      return transactionService.getAll({
        institutionId,
        memberId,
        groupId,
        status: status as any,
        allocationStatus: status as any,
        limit,
        dateRange,
        searchTerm,
      });
    },
    enabled: autoFetch && !!institutionId,
    placeholderData: (previousData) => previousData,
  });

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: (params: {
      institution_id: string;
      member_id?: string;
      group_id?: string;
      type: string;
      amount: number;
      currency?: string;
      channel: string;
      status?: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
      reference?: string;
    }) =>
      transactionService.create({
        institutionId: params.institution_id,
        memberId: params.member_id,
        groupId: params.group_id,
        type: params.type,
        amount: params.amount,
        currency: params.currency,
        channel: params.channel,
        status: params.status,
        reference: params.reference,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
    },
  });

  // Update transaction status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED' }) =>
      transactionService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTransactions = queryClient.getQueryData<SupabaseTransaction[]>(queryKey);
      queryClient.setQueryData<SupabaseTransaction[]>(queryKey, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t))
      );
      return { previousTransactions };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKey, context.previousTransactions);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
    },
  });

  // Allocate transaction mutation
  const allocateMutation = useMutation({
    mutationFn: (params: { transactionId: string; memberId: string; note?: string | null }) =>
      transactionService.allocate({
        transactionId: params.transactionId,
        memberId: params.memberId,
        note: params.note,
      }),
    onMutate: async ({ transactionId, memberId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTransactions = queryClient.getQueryData<SupabaseTransaction[]>(queryKey);
      queryClient.setQueryData<SupabaseTransaction[]>(queryKey, (old) =>
        old?.map((t) =>
          t.id === transactionId
            ? { ...t, member_id: memberId, allocation_status: 'allocated', allocated_at: new Date().toISOString() }
            : t
        )
      );
      return { previousTransactions };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKey, context.previousTransactions);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
    },
  });

  const createTransaction = async (params: Parameters<typeof createMutation.mutateAsync>[0]) => {
    // Queue action if offline
    if (!navigator.onLine) {
      const { queueAction } = await import('../lib/offline/queue');
      queueAction({
        type: 'create',
        resource: 'transaction',
        payload: params,
      });
      return {
        ...params,
        id: `temp-${Date.now()}`,
        institution_id: institutionId || '',
        occurred_at: new Date().toISOString(),
        allocation_status: 'unallocated',
        status: 'PENDING',
      } as SupabaseTransaction;
    }
    return createMutation.mutateAsync(params);
  };

  const updateTransactionStatus = async (id: string, status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED') => {
    return updateStatusMutation.mutateAsync({ id, status });
  };

  const allocateTransaction = async (transactionId: string, memberId: string, note?: string | null) => {
    // Queue action if offline
    if (!navigator.onLine) {
      const { queueAction } = await import('../lib/offline/queue');
      queueAction({
        type: 'allocate',
        resource: 'transaction',
        payload: { transaction_id: transactionId, member_id: memberId, note },
      });
      return {
        id: transactionId,
        member_id: memberId,
        allocation_status: 'allocated',
        allocated_at: new Date().toISOString(),
      } as any;
    }
    return allocateMutation.mutateAsync({ transactionId, memberId, note });
  };

  const refetch = async () => {
    await refetchQuery();
  };

  // Handle errors consistently
  const errorMessage = error ? getUserFriendlyMessage(error) : null;

  return {
    transactions,
    loading: isLoading,
    error: errorMessage,
    refetch,
    createTransaction,
    updateTransactionStatus,
    allocateTransaction,
    isFetching,
    isRefetching,
  };
}
