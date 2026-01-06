/**
 * Custom hook for transaction data management
 * 
 * Provides a clean interface for components to interact with transaction data
 */

import { useState, useEffect, useCallback } from 'react';
import * as transactionsApi from '../lib/api/transactions.api';
import type { SupabaseTransaction } from '../types';
import { useAuth } from '../contexts/AuthContext';

export interface UseTransactionsOptions {
  memberId?: string;
  groupId?: string;
  status?: string;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseTransactionsReturn {
  transactions: Array<SupabaseTransaction & { members?: { full_name?: string | null } }>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTransaction: (params: transactionsApi.CreateTransactionParams) => Promise<SupabaseTransaction>;
  updateTransactionStatus: (id: string, status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED') => Promise<SupabaseTransaction>;
}

export function useTransactions(options: UseTransactionsOptions = {}): UseTransactionsReturn {
  const { institutionId } = useAuth();
  const { memberId, groupId, status, limit, autoFetch = true } = options;

  const [transactions, setTransactions] = useState<Array<SupabaseTransaction & { members?: { full_name?: string | null } }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!institutionId) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await transactionsApi.fetchTransactions(institutionId, {
        memberId,
        groupId,
        status,
        limit
      });
      setTransactions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [institutionId, memberId, groupId, status, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchTransactions();
    }
  }, [autoFetch, fetchTransactions]);

  const createTransaction = useCallback(async (params: transactionsApi.CreateTransactionParams) => {
    setError(null);
    try {
      const newTransaction = await transactionsApi.createTransaction(params);
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateTransactionStatus = useCallback(async (id: string, status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED') => {
    setError(null);
    try {
      const updated = await transactionsApi.updateTransactionStatus(id, status);
      setTransactions(prev => prev.map(t => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transaction';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    createTransaction,
    updateTransactionStatus
  };
}

