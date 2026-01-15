/**
 * Dashboard Stats Hook with Time Filtering
 * 
 * Enhanced version that supports time range filtering for dashboard KPIs.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { KpiStats } from '@/types';
import { safeQuery } from '@/lib/safeQuery';
import { TimeRange, getDateRangeFromFilter } from '@/features/dashboard/components/TimeRangeFilter';

const EMPTY_STATS: KpiStats = {
    totalMembers: 0,
    activeMembers: 0,
    activeGroups: 0,
    totalGroupFunds: 0,
    totalSavings: 0,
    totalDeposits: 0,
    totalLoans: 0,
    outstandingLoans: 0,
    unallocatedCount: 0,
    tokenSupply: 0,
    dailyDeposits: 0,
    reconciliationStatus: 'Pending',
};

export interface UseDashboardStatsOptions {
    /** Time range filter */
    timeRange?: TimeRange;
    /** Auto-refetch on filter change */
    autoRefetch?: boolean;
}

export interface UseDashboardStatsReturn {
    stats: KpiStats;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useDashboardStatsV2(options: UseDashboardStatsOptions = {}): UseDashboardStatsReturn {
    const { timeRange = 'month', autoRefetch = true } = options;
    const { institutionId } = useAuth();
    const [stats, setStats] = useState<KpiStats>(EMPTY_STATS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!institutionId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get date range for time filtering
            const { start, end } = getDateRangeFromFilter(timeRange);
            const startISO = start.toISOString().split('T')[0];
            const endISO = end.toISOString().split('T')[0];

            // Run all queries in parallel
            const [
                membersCount,
                activeMembersCount,
                activeGroupsCount,
                groupsFunds,
                membersSavings,
                loansData,
                depositsData,
                unallocatedData,
                todayDepositsData
            ] = await Promise.all([
                // Total Members
                safeQuery(
                    supabase
                        .from('members')
                        .select('*', { count: 'exact', head: true })
                        .eq('institution_id', institutionId)
                ),
                // Active Members
                safeQuery(
                    supabase
                        .from('members')
                        .select('*', { count: 'exact', head: true })
                        .eq('institution_id', institutionId)
                        .eq('status', 'ACTIVE')
                ),
                // Active Groups
                safeQuery(
                    supabase
                        .from('groups')
                        .select('*', { count: 'exact', head: true })
                        .eq('institution_id', institutionId)
                        .eq('status', 'ACTIVE')
                ),
                // Total Group Funds
                safeQuery(
                    supabase
                        .from('groups')
                        .select('fund_balance')
                        .eq('institution_id', institutionId)
                ),
                // Total Member Savings
                safeQuery(
                    supabase
                        .from('members')
                        .select('savings_balance')
                        .eq('institution_id', institutionId)
                ),
                // Outstanding Loans
                safeQuery(
                    supabase
                        .from('loans')
                        .select('outstanding_balance')
                        .eq('institution_id', institutionId)
                        .in('status', ['ACTIVE', 'OVERDUE'])
                ),
                // Total Deposits in time range
                safeQuery(
                    supabase
                        .from('transactions')
                        .select('amount')
                        .eq('institution_id', institutionId)
                        .in('type', ['DEPOSIT', 'CONTRIBUTION'])
                        .eq('status', 'COMPLETED')
                        .gte('occurred_at', startISO)
                        .lte('occurred_at', endISO)
                ),
                // Unallocated transactions
                safeQuery(
                    supabase
                        .from('transactions')
                        .select('*', { count: 'exact', head: true })
                        .eq('institution_id', institutionId)
                        .eq('allocation_status', 'unallocated')
                ),
                // Today's deposits
                safeQuery(
                    supabase
                        .from('transactions')
                        .select('amount')
                        .eq('institution_id', institutionId)
                        .eq('type', 'DEPOSIT')
                        .eq('status', 'COMPLETED')
                        .gte('occurred_at', new Date().toISOString().split('T')[0])
                )
            ]);

            // Calculate sums safely
            const fundsData = groupsFunds.data as unknown as Array<{ fund_balance?: number }> | null;
            const savingsDataList = membersSavings.data as unknown as Array<{ savings_balance?: number }> | null;
            const loansDataList = loansData.data as unknown as Array<{ outstanding_balance?: number }> | null;
            const depositsDataList = depositsData.data as unknown as Array<{ amount?: number }> | null;
            const todayDepositsList = todayDepositsData.data as unknown as Array<{ amount?: number }> | null;

            const totalGroupFunds = (fundsData || []).reduce((sum, g) => sum + (g.fund_balance || 0), 0);
            const totalSavings = (savingsDataList || []).reduce((sum, m) => sum + (m.savings_balance || 0), 0);
            const outstandingLoans = (loansDataList || []).reduce((sum, l) => sum + (l.outstanding_balance || 0), 0);
            const totalDeposits = (depositsDataList || []).reduce((sum, t) => sum + (t.amount || 0), 0);
            const dailyDeposits = (todayDepositsList || []).reduce((sum, t) => sum + (t.amount || 0), 0);

            const unallocatedCount = (unallocatedData as any)?.count || 0;

            setStats({
                totalMembers: membersCount.data?.count || 0,
                activeMembers: activeMembersCount.data?.count || 0,
                activeGroups: activeGroupsCount.data?.count || 0,
                totalGroupFunds,
                totalSavings,
                totalDeposits,
                totalLoans: outstandingLoans, // Same as outstanding for now
                outstandingLoans,
                unallocatedCount,
                tokenSupply: 0,
                dailyDeposits,
                reconciliationStatus: unallocatedCount > 0 ? 'Issues' : 'Balanced',
            });
        } catch (err: any) {
            console.error('Dashboard stats fetch error:', err);
            setError('Failed to load dashboard statistics.');
        } finally {
            setLoading(false);
        }
    }, [institutionId, timeRange]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, error, refetch: fetchStats };
}

// Keep the original function for backward compatibility
export function useDashboardStats() {
    const result = useDashboardStatsV2({ timeRange: 'all' });
    return result;
}

export default useDashboardStats;
