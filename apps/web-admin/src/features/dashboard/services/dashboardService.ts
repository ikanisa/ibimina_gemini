/**
 * Dashboard Service
 * 
 * Encapsulates all dashboard-related data operations with typed error handling.
 */

import { supabase } from '@/core/config/supabase';
import {
    AppError,
    SupabaseError,
    ValidationError,
    TimeoutError,
    createAppError
} from '@/core/errors';

// ============================================================================
// Types
// ============================================================================

export interface DashboardSummary {
    totalMembers: number;
    activeMembers: number;
    totalGroups: number;
    activeGroups: number;
    totalSavings: number;
    totalLoans: number;
    pendingTransactions: number;
    todayDeposits: number;
    todayWithdrawals: number;
    unallocatedCount: number;
}

export interface DashboardKPIs {
    members: {
        total: number;
        active: number;
        new30d: number;
    };
    groups: {
        total: number;
        active: number;
    };
    transactions: {
        pending: number;
        unallocated: number;
        todayCount: number;
        todayVolume: number;
    };
    finances: {
        totalSavings: number;
        totalLoans: number;
        savingsChange7d: number;
        loansChange7d: number;
    };
}

export interface RecentActivity {
    id: string;
    type: 'deposit' | 'withdrawal' | 'loan' | 'member_joined' | 'group_created';
    description: string;
    amount?: number;
    timestamp: string;
    actorName?: string;
}

const DEFAULT_TIMEOUT_MS = 20000;

// ============================================================================
// Service Implementation
// ============================================================================

export const dashboardService = {
    /**
     * Get dashboard summary via RPC
     */
    async getSummary(
        institutionId: string | null,
        days: number = 7
    ): Promise<DashboardSummary> {
        try {
            const startTime = Date.now();

            const { data, error } = await supabase.rpc('get_dashboard_summary', {
                p_institution_id: institutionId || null,
                p_days: days,
            });

            const elapsed = Date.now() - startTime;
            if (elapsed > DEFAULT_TIMEOUT_MS) {
                console.warn(`[Dashboard] Slow query: ${elapsed}ms`);
            }

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            // Map RPC response to typed object with defaults
            return {
                totalMembers: data?.total_members ?? 0,
                activeMembers: data?.active_members ?? 0,
                totalGroups: data?.total_groups ?? 0,
                activeGroups: data?.active_groups ?? 0,
                totalSavings: data?.total_savings ?? 0,
                totalLoans: data?.total_loans ?? 0,
                pendingTransactions: data?.pending_transactions ?? 0,
                todayDeposits: data?.today_deposits ?? 0,
                todayWithdrawals: data?.today_withdrawals ?? 0,
                unallocatedCount: data?.unallocated_count ?? 0,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'dashboardService.getSummary');
        }
    },

    /**
     * Get detailed KPIs for dashboard
     */
    async getKPIs(institutionId: string | null): Promise<DashboardKPIs> {
        try {
            // For now, use the summary RPC and transform
            const summary = await this.getSummary(institutionId);

            return {
                members: {
                    total: summary.totalMembers,
                    active: summary.activeMembers,
                    new30d: 0, // Would need separate query
                },
                groups: {
                    total: summary.totalGroups,
                    active: summary.activeGroups,
                },
                transactions: {
                    pending: summary.pendingTransactions,
                    unallocated: summary.unallocatedCount,
                    todayCount: 0, // Would need separate query
                    todayVolume: summary.todayDeposits + summary.todayWithdrawals,
                },
                finances: {
                    totalSavings: summary.totalSavings,
                    totalLoans: summary.totalLoans,
                    savingsChange7d: 0, // Would need historical data
                    loansChange7d: 0,
                },
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'dashboardService.getKPIs');
        }
    },

    /**
     * Get recent activity for dashboard feed
     */
    async getRecentActivity(
        institutionId: string,
        limit: number = 10
    ): Promise<RecentActivity[]> {
        try {
            if (!institutionId) {
                throw new ValidationError('Institution ID is required');
            }

            // Fetch recent transactions as activity
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('id, type, amount, occurred_at, payer_name')
                .eq('institution_id', institutionId)
                .order('occurred_at', { ascending: false })
                .limit(limit);

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            // Transform to activity items
            return (transactions || []).map((txn) => ({
                id: txn.id,
                type: txn.type?.toLowerCase() === 'withdrawal' ? 'withdrawal' : 'deposit',
                description: `${txn.type} of ${txn.amount?.toLocaleString()} RWF`,
                amount: txn.amount,
                timestamp: txn.occurred_at,
                actorName: txn.payer_name,
            })) as RecentActivity[];
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'dashboardService.getRecentActivity');
        }
    },

    /**
     * Get attention items (things that need user action)
     */
    async getAttentionItems(institutionId: string): Promise<{
        unallocatedTransactions: number;
        pendingApprovals: number;
        overdueLoans: number;
        flaggedTransactions: number;
    }> {
        try {
            if (!institutionId) {
                throw new ValidationError('Institution ID is required');
            }

            // Fetch counts in parallel
            const [unallocated, flagged] = await Promise.all([
                supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('institution_id', institutionId)
                    .eq('allocation_status', 'unallocated'),
                supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('institution_id', institutionId)
                    .eq('allocation_status', 'flagged'),
            ]);

            return {
                unallocatedTransactions: unallocated.count || 0,
                pendingApprovals: 0, // Would need approval workflow table
                overdueLoans: 0, // Would need loans table
                flaggedTransactions: flagged.count || 0,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'dashboardService.getAttentionItems');
        }
    },
};

export default dashboardService;
