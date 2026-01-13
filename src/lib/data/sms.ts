/**
 * Domain data layer: SMS Messages
 * Provides typed functions for accessing sms_messages table
 */
import { supabase } from '../supabase';
import type { SupabaseSmsMessage } from '../../types';

export interface ListSmsParams {
    institutionId?: string;
    isParsed?: boolean;
    limit?: number;
    offset?: number;
}

export interface SmsResult {
    data: SupabaseSmsMessage[];
    error: string | null;
    count: number | null;
}

/**
 * List SMS messages with optional filtering
 */
export async function listSmsMessages(params: ListSmsParams = {}): Promise<SmsResult> {
    const { institutionId, isParsed, limit = 50, offset = 0 } = params;

    try {
        let query = supabase
            .from('sms_messages')
            .select('*', { count: 'exact' })
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);

        if (institutionId) {
            query = query.eq('institution_id', institutionId);
        }

        if (isParsed !== undefined) {
            query = query.eq('is_parsed', isParsed);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching SMS messages:', error);
            return { data: [], error: error.message, count: null };
        }

        return {
            data: (data ?? []) as SupabaseSmsMessage[],
            error: null,
            count
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: [], error: message, count: null };
    }
}

/**
 * Link SMS to a transaction
 */
export async function linkSmsToTransaction(
    smsId: string,
    transactionId: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const { error } = await supabase
            .from('sms_messages')
            .update({ linked_transaction_id: transactionId })
            .eq('id', smsId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: message };
    }
}

/**
 * Mark SMS as parsed with extracted data
 */
export async function markSmsAsParsed(
    smsId: string,
    parsedData: {
        amount: number;
        currency: string;
        transactionId: string;
        counterparty?: string;
    }
): Promise<{ success: boolean; error: string | null }> {
    try {
        const { error } = await supabase
            .from('sms_messages')
            .update({
                is_parsed: true,
                parsed_amount: parsedData.amount,
                parsed_currency: parsedData.currency,
                parsed_transaction_id: parsedData.transactionId,
                parsed_counterparty: parsedData.counterparty
            })
            .eq('id', smsId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: message };
    }
}
