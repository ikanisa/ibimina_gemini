/**
 * Reconciliation API Service
 * 
 * Centralized service for all reconciliation-related database operations
 */

import { supabase } from '../supabase';
import type { SupabaseReconciliationIssue } from '../../types';

export interface CreateReconciliationIssueParams {
  institution_id: string;
  source: string;
  amount: number;
  source_reference?: string;
  ledger_status: string;
  notes?: string;
  linked_transaction_id?: string;
}

/**
 * Fetch reconciliation issues for an institution
 */
export async function fetchReconciliationIssues(institutionId: string, filters?: {
  status?: 'OPEN' | 'RESOLVED' | 'IGNORED';
  limit?: number;
}) {
  let query = supabase
    .from('reconciliation_issues')
    .select('*')
    .eq('institution_id', institutionId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('detected_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch reconciliation issues: ${error.message}`);
  }

  return data as SupabaseReconciliationIssue[];
}

/**
 * Create a new reconciliation issue
 */
export async function createReconciliationIssue(params: CreateReconciliationIssueParams) {
  const { data, error } = await supabase
    .from('reconciliation_issues')
    .insert({
      institution_id: params.institution_id,
      source: params.source,
      amount: params.amount,
      source_reference: params.source_reference,
      ledger_status: params.ledger_status,
      notes: params.notes,
      linked_transaction_id: params.linked_transaction_id,
      status: 'OPEN'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create reconciliation issue: ${error.message}`);
  }

  return data as SupabaseReconciliationIssue;
}

/**
 * Resolve a reconciliation issue
 */
export async function resolveReconciliationIssue(issueId: string, notes?: string) {
  const { data, error } = await supabase
    .from('reconciliation_issues')
    .update({
      status: 'RESOLVED',
      resolved_at: new Date().toISOString(),
      notes
    })
    .eq('id', issueId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to resolve reconciliation issue: ${error.message}`);
  }

  return data as SupabaseReconciliationIssue;
}

/**
 * Ignore a reconciliation issue
 */
export async function ignoreReconciliationIssue(issueId: string, notes?: string) {
  const { data, error } = await supabase
    .from('reconciliation_issues')
    .update({
      status: 'IGNORED',
      resolved_at: new Date().toISOString(),
      notes
    })
    .eq('id', issueId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to ignore reconciliation issue: ${error.message}`);
  }

  return data as SupabaseReconciliationIssue;
}

/**
 * Get reconciliation statistics
 */
export async function getReconciliationStats(institutionId: string) {
  const [openIssues, resolvedIssues, totalIssues] = await Promise.all([
    supabase
      .from('reconciliation_issues')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .eq('status', 'OPEN'),
    supabase
      .from('reconciliation_issues')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .eq('status', 'RESOLVED'),
    supabase
      .from('reconciliation_issues')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
  ]);

  return {
    open: openIssues.count || 0,
    resolved: resolvedIssues.count || 0,
    total: totalIssues.count || 0
  };
}

