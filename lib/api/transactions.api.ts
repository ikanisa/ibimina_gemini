/**
 * Transactions API Service
 * 
 * Centralized service for all transaction-related database operations
 */

import { supabase } from '../supabase';
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
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('transactions')
    .select('*, members(full_name)')
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

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data as Array<SupabaseTransaction & { members?: { full_name?: string | null } }>;
}

/**
 * Fetch transactions from payment ledger
 */
export async function fetchPaymentLedger(institutionId: string, filters?: {
  reconciled?: boolean;
  limit?: number;
  offset?: number;
}) {
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
}

