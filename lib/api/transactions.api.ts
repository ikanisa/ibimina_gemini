/**
 * Transactions API Service
 * 
 * Centralized service for all transaction-related database operations
 */

import { supabase } from '../supabase';
import { deduplicateRequest } from '../utils/requestDeduplication';
import type { SupabaseTransaction } from '../../types';

export interface CreateTransactionParams {
  institution_id: string;
  member_id?: string;
  group_id?: string;
  type: string;
  amount: number;
  currency?: string;
  channel: string;
  status?: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
  reference?: string;
}

/**
 * Fetch transactions for an institution
 */
export async function fetchTransactions(institutionId: string, filters?: {
  memberId?: string;
  groupId?: string;
  status?: string;
  allocationStatus?: string;
  limit?: number;
  offset?: number;
  dateRange?: { start: string; end: string };
  searchTerm?: string;
}) {
  // Create unique key for deduplication
  const key = `transactions:${institutionId}:${JSON.stringify(filters || {})}`;
  
  return deduplicateRequest(key, async () => {
    let query = supabase
    .from('transactions')
    .select('*, members(full_name), groups(name)')
    .eq('institution_id', institutionId);

  if (filters?.memberId) {
    query = query.eq('member_id', filters.memberId);
  }
  if (filters?.groupId) {
    query = query.eq('group_id', filters.groupId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.allocationStatus) {
    query = query.eq('allocation_status', filters.allocationStatus);
  }

  // Date range filter
  if (filters?.dateRange) {
    query = query
      .gte('occurred_at', `${filters.dateRange.start}T00:00:00`)
      .lte('occurred_at', `${filters.dateRange.end}T23:59:59`);
  }

  // Search term filter (searches payer_phone, momo_ref, payer_name)
  if (filters?.searchTerm?.trim()) {
    const searchTerm = filters.searchTerm.trim();
    query = query.or(
      `payer_phone.ilike.%${searchTerm}%,momo_ref.ilike.%${searchTerm}%,payer_name.ilike.%${searchTerm}%`
    );
  }

  // Order by occurred_at (preferred) or created_at (fallback)
  query = query.order('occurred_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset !== undefined) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return data as Array<SupabaseTransaction & { members?: { full_name?: string | null }; groups?: { name?: string | null } }>;
  });
}

/**
 * Fetch transactions from payment ledger
 */
export async function fetchPaymentLedger(institutionId: string, filters?: {
  reconciled?: boolean;
  limit?: number;
  offset?: number;
}) {
  const key = `fetchPaymentLedger:${institutionId}:${JSON.stringify(filters || {})}`;
  return deduplicateRequest(key, async () => {
    let query = supabase
    .from('payment_ledger')
    .select('*')
    .eq('institution_id', institutionId);

  if (filters?.reconciled !== undefined) {
    query = query.eq('reconciled', filters.reconciled);
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch payment ledger: ${error.message}`);
    }

    return data;
  });
}

/**
 * Create a new transaction
 */
export async function createTransaction(params: CreateTransactionParams) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      institution_id: params.institution_id,
      member_id: params.member_id,
      group_id: params.group_id,
      type: params.type,
      amount: params.amount,
      currency: params.currency || 'RWF',
      channel: params.channel,
      status: params.status || 'COMPLETED',
      reference: params.reference
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return data as SupabaseTransaction;
}

/**
 * Create a payment ledger entry
 */
export async function createPaymentLedgerEntry(params: {
  institution_id: string;
  member_id?: string;
  group_id?: string;
  txn_type: string;
  amount: number;
  currency?: string;
  counterparty?: string;
  reference?: string;
  txn_id?: string;
  reconciled?: boolean;
}) {
  const { data, error } = await supabase
    .from('payment_ledger')
    .insert({
      institution_id: params.institution_id,
      member_id: params.member_id,
      group_id: params.group_id,
      txn_type: params.txn_type,
      amount: params.amount,
      currency: params.currency || 'RWF',
      counterparty: params.counterparty,
      reference: params.reference,
      txn_id: params.txn_id,
      reconciled: params.reconciled || false,
      timestamp: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create payment ledger entry: ${error.message}`);
  }

  return data;
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(transactionId: string, status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED') {
  const { data, error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  return data as SupabaseTransaction;
}

/**
 * Mark payment ledger entry as reconciled
 */
export async function reconcilePaymentLedgerEntry(entryId: string) {
  const key = `reconcilePaymentLedgerEntry:${entryId}`;
  return deduplicateRequest(key, async () => {
    const { data, error } = await supabase
      .from('payment_ledger')
      .update({ reconciled: true })
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reconcile payment: ${error.message}`);
    }

    return data;
  });
}

/**
 * Allocate a transaction to a member
 */
export interface AllocateTransactionParams {
  transaction_id: string;
  member_id: string;
  note?: string | null;
}

export async function allocateTransaction(params: AllocateTransactionParams) {
  const key = `allocateTransaction:${params.transaction_id}:${params.member_id}`;
  return deduplicateRequest(key, async () => {
    const { data, error } = await supabase.rpc('allocate_transaction', {
      p_transaction_id: params.transaction_id,
      p_member_id: params.member_id,
      p_note: params.note || null
    });

    if (error) {
      throw new Error(`Failed to allocate transaction: ${error.message}`);
    }

    // Fetch updated transaction details
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select('*, members(full_name), groups(name)')
      .eq('id', params.transaction_id)
      .single();

    if (transactionError) {
      throw new Error(`Failed to fetch updated transaction: ${transactionError.message}`);
    }

    return transactionData as SupabaseTransaction & { members?: { full_name?: string | null }; groups?: { name?: string | null } };
  });
}

