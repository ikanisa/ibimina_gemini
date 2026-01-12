/**
 * SMS Messages API Service
 * 
 * Centralized service for all SMS message-related database operations
 */

import { supabase } from '../supabase';
import { deduplicateRequest } from '../utils/requestDeduplication';
import type { SupabaseSmsMessage } from '../../types';

export interface CreateSmsParams {
  institution_id: string;
  sender: string;
  timestamp: string;
  body: string;
  is_parsed?: boolean;
  parsed_amount?: number;
  parsed_currency?: string;
  parsed_transaction_id?: string;
  parsed_counterparty?: string;
}

export interface UpdateSmsParams {
  is_parsed?: boolean;
  parsed_amount?: number;
  parsed_currency?: string;
  parsed_transaction_id?: string;
  parsed_counterparty?: string;
  linked_transaction_id?: string;
}

/**
 * Fetch SMS messages for an institution
 */
export async function fetchSmsMessages(institutionId: string, filters?: {
  isParsed?: boolean;
  limit?: number;
  offset?: number;
}) {
  const key = `fetchSmsMessages:${institutionId}:${JSON.stringify(filters || {})}`;
  return deduplicateRequest(key, async () => {
    let query = supabase
      .from('sms_messages')
      .select('*')
      .eq('institution_id', institutionId);

    if (filters?.isParsed !== undefined) {
      query = query.eq('is_parsed', filters.isParsed);
    }

    query = query.order('timestamp', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch SMS messages: ${error.message}`);
    }

    return data as SupabaseSmsMessage[];
  });
}

/**
 * Fetch a single SMS message by ID
 */
export async function fetchSmsMessageById(smsId: string) {
  const key = `fetchSmsMessageById:${smsId}`;
  return deduplicateRequest(key, async () => {
    const { data, error } = await supabase
    .from('sms_messages')
    .select('*')
    .eq('id', smsId)
    .single();

    if (error) {
      throw new Error(`Failed to fetch SMS message: ${error.message}`);
    }

    return data as SupabaseSmsMessage;
  });
}

/**
 * Create a new SMS message
 */
export async function createSmsMessage(params: CreateSmsParams) {
  const { data, error } = await supabase
    .from('sms_messages')
    .insert({
      institution_id: params.institution_id,
      sender: params.sender,
      timestamp: params.timestamp,
      body: params.body,
      is_parsed: params.is_parsed || false,
      parsed_amount: params.parsed_amount,
      parsed_currency: params.parsed_currency,
      parsed_transaction_id: params.parsed_transaction_id,
      parsed_counterparty: params.parsed_counterparty
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create SMS message: ${error.message}`);
  }

  return data as SupabaseSmsMessage;
}

/**
 * Update an SMS message (typically to mark as parsed or link to transaction)
 */
export async function updateSmsMessage(smsId: string, params: UpdateSmsParams) {
  const { data, error } = await supabase
    .from('sms_messages')
    .update(params)
    .eq('id', smsId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update SMS message: ${error.message}`);
  }

  return data as SupabaseSmsMessage;
}

/**
 * Link SMS message to a transaction
 */
export async function linkSmsToTransaction(smsId: string, transactionId: string) {
  return updateSmsMessage(smsId, { linked_transaction_id: transactionId });
}

/**
 * Search SMS messages by sender or body content
 */
export async function searchSmsMessages(institutionId: string, searchTerm: string) {
  const key = `searchSmsMessages:${institutionId}:${searchTerm}`;
  return deduplicateRequest(key, async () => {
    const { data, error } = await supabase
    .from('sms_messages')
    .select('*')
    .eq('institution_id', institutionId)
    .or(`sender.ilike.%${searchTerm}%,body.ilike.%${searchTerm}%`)
    .order('timestamp', { ascending: false })
    .limit(50);

    if (error) {
      throw new Error(`Failed to search SMS messages: ${error.message}`);
    }

    return data as SupabaseSmsMessage[];
  });
}

