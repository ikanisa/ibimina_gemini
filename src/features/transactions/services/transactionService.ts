/**
 * Transaction Service
 * 
 * Encapsulates all transaction-related data operations with typed error handling.
 * Use this service instead of direct API calls for consistent error handling.
 */

import { supabase } from '@/core/config/supabase';
import type { SupabaseTransaction, ConsolidatedTransaction } from '@/core/types';
import {
    AppError,
    SupabaseError,
    NotFoundError,
    ValidationError,
    createAppError
} from '@/core/errors';

// ============================================================================
// Types
// ============================================================================

export interface TransactionFilters {
    institutionId: string;
    memberId?: string;
    groupId?: string;
    status?: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
    allocationStatus?: 'unallocated' | 'allocated' | 'flagged' | 'duplicate';
    limit?: number;
    offset?: number;
    dateRange?: { start: string; end: string };
    searchTerm?: string;
}

export interface CreateTransactionInput {
    institutionId: string;
    memberId?: string;
    groupId?: string;
    type: string;
    amount: number;
    currency?: string;
    channel: string;
    status?: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
    reference?: string;
}

export interface AllocateTransactionInput {
    transactionId: string;
    memberId: string;
    note?: string | null;
}

export type TransactionWithRelations = SupabaseTransaction & {
    members?: { full_name?: string | null };
    groups?: { name?: string | null };
};

// ============================================================================
// Service Implementation
// ============================================================================

export const transactionService = {
    /**
     * Fetch transactions with optional filters
     */
    async getAll(filters: TransactionFilters): Promise<TransactionWithRelations[]> {
        try {
            if (!filters.institutionId) {
                throw new ValidationError('Institution ID is required');
            }

            let query = supabase
                .from('transactions')
                .select('*, members(full_name), groups(name)')
                .eq('institution_id', filters.institutionId);

            // Apply filters
            if (filters.memberId) {
                query = query.eq('member_id', filters.memberId);
            }
            if (filters.groupId) {
                query = query.eq('group_id', filters.groupId);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.allocationStatus) {
                query = query.eq('allocation_status', filters.allocationStatus);
            }
            if (filters.dateRange) {
                query = query
                    .gte('occurred_at', `${filters.dateRange.start}T00:00:00`)
                    .lte('occurred_at', `${filters.dateRange.end}T23:59:59`);
            }
            if (filters.searchTerm?.trim()) {
                const term = filters.searchTerm.trim();
                query = query.or(
                    `payer_phone.ilike.%${term}%,momo_ref.ilike.%${term}%,payer_name.ilike.%${term}%`
                );
            }

            // Ordering and pagination
            query = query.order('occurred_at', { ascending: false });

            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset !== undefined) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
            }

            const { data, error } = await query;

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data as TransactionWithRelations[];
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'transactionService.getAll');
        }
    },

    /**
     * Get a single transaction by ID
     */
    async getById(id: string): Promise<TransactionWithRelations> {
        try {
            if (!id) {
                throw new ValidationError('Transaction ID is required');
            }

            const { data, error } = await supabase
                .from('transactions')
                .select(`
          *,
          members(id, full_name, phone),
          groups(id, name)
        `)
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new NotFoundError('Transaction', id);
                }
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data as TransactionWithRelations;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'transactionService.getById');
        }
    },

    /**
     * Create a new transaction
     */
    async create(input: CreateTransactionInput): Promise<SupabaseTransaction> {
        try {
            // Validation
            if (!input.institutionId) {
                throw new ValidationError('Institution ID is required');
            }
            if (!input.amount || input.amount <= 0) {
                throw new ValidationError('Amount must be greater than 0', { amount: 'Invalid amount' });
            }
            if (!input.type) {
                throw new ValidationError('Transaction type is required', { type: 'Required' });
            }
            if (!input.channel) {
                throw new ValidationError('Channel is required', { channel: 'Required' });
            }

            const { data, error } = await supabase
                .from('transactions')
                .insert({
                    institution_id: input.institutionId,
                    member_id: input.memberId,
                    group_id: input.groupId,
                    type: input.type,
                    amount: input.amount,
                    currency: input.currency || 'RWF',
                    channel: input.channel,
                    status: input.status || 'COMPLETED',
                    reference: input.reference,
                })
                .select()
                .single();

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data as SupabaseTransaction;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'transactionService.create');
        }
    },

    /**
     * Update transaction status
     */
    async updateStatus(
        transactionId: string,
        status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED'
    ): Promise<SupabaseTransaction> {
        try {
            if (!transactionId) {
                throw new ValidationError('Transaction ID is required');
            }

            const { data, error } = await supabase
                .from('transactions')
                .update({ status })
                .eq('id', transactionId)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new NotFoundError('Transaction', transactionId);
                }
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data as SupabaseTransaction;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'transactionService.updateStatus');
        }
    },

    /**
     * Allocate a transaction to a member
     */
    async allocate(input: AllocateTransactionInput): Promise<TransactionWithRelations> {
        try {
            if (!input.transactionId) {
                throw new ValidationError('Transaction ID is required');
            }
            if (!input.memberId) {
                throw new ValidationError('Member ID is required');
            }

            // Call the RPC function for allocation (handles audit, etc.)
            const { error: rpcError } = await supabase.rpc('allocate_transaction', {
                p_transaction_id: input.transactionId,
                p_member_id: input.memberId,
                p_note: input.note || null,
            });

            if (rpcError) {
                throw new SupabaseError(rpcError.message, rpcError.code, rpcError.hint);
            }

            // Fetch updated transaction
            const { data, error } = await supabase
                .from('transactions')
                .select('*, members(full_name), groups(name)')
                .eq('id', input.transactionId)
                .single();

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data as TransactionWithRelations;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'transactionService.allocate');
        }
    },

    /**
     * Batch allocate multiple transactions
     */
    async allocateBatch(
        transactionIds: string[],
        memberId: string,
        groupId?: string,
        allocatedBy?: string
    ): Promise<SupabaseTransaction[]> {
        try {
            if (!transactionIds.length) {
                throw new ValidationError('At least one transaction ID is required');
            }
            if (!memberId) {
                throw new ValidationError('Member ID is required');
            }

            const { data, error } = await supabase
                .from('transactions')
                .update({
                    member_id: memberId,
                    group_id: groupId,
                    allocation_status: 'allocated',
                    allocated_at: new Date().toISOString(),
                    allocated_by: allocatedBy,
                })
                .in('id', transactionIds)
                .select();

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data as SupabaseTransaction[];
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'transactionService.allocateBatch');
        }
    },

    /**
     * Get unallocated transactions count
     */
    async getUnallocatedCount(institutionId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('institution_id', institutionId)
                .eq('allocation_status', 'unallocated');

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return count || 0;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'transactionService.getUnallocatedCount');
        }
    },
};

export default transactionService;
