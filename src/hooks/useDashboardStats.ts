import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { KpiStats } from '../types';
import { withTimeout } from '../lib/utils/timeout';
import { safeQuery } from '../lib/safeQuery';

const EMPTY_STATS: KpiStats = {
    totalMembers: 0,
    activeMembers: 0,
    activeGroups: 0,
    totalGroupFunds: 0,
    totalSavings: 0,
    outstandingLoans: 0,
    tokenSupply: 0,
    dailyDeposits: 0,
    reconciliationStatus: 'Pending',
};

export function useDashboardStats() {
    const { institutionId } = useAuth();
    const [stats, setStats] = useState<KpiStats>(EMPTY_STATS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!institutionId) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                // Run queries in parallel
                const [
                    membersCount,
                    activeMembersCount,
                    activeGroupsCount,
                    groupsFunds,
                    membersSavings,
                    todayDeposits,
                    reconciliationIssues
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
                    // Today's Deposits
                    safeQuery(
                        supabase
                            .from('transactions')
                            .select('amount')
                            .eq('institution_id', institutionId)
                            .eq('type', 'DEPOSIT')
                            .eq('status', 'COMPLETED')
                            .gte('occurred_at', new Date().toISOString().split('T')[0])
                    ),
                    // Reconciliation Issues
                    safeQuery(
                        supabase
                            .from('transactions')
                            .select('*', { count: 'exact', head: true })
                            .eq('institution_id', institutionId)
                            .eq('allocation_status', 'unallocated')
                    )
                ]);

                // Check for errors (any critical failure)
                const errors = [
                    membersCount.error, activeMembersCount.error, activeGroupsCount.error,
                    groupsFunds.error, membersSavings.error, todayDeposits.error, reconciliationIssues.error
                ].filter(Boolean);

                if (errors.length > 0) {
                    // We just log the first error but the UI might show partial data if we wanted.
                    // For now, fail if any critical data is missing.
                    console.error('Errors fetching stats:', errors);
                    setError('Some dashboard data could not be loaded.');
                    // Don't throw, try to show what we have
                }

                // Calculate sums safely - safeQuery returns data directly, use type assertions
                const fundsData = groupsFunds.data as unknown as Array<{ fund_balance?: number }> | null;
                const savingsData = membersSavings.data as unknown as Array<{ savings_balance?: number }> | null;
                const depositsData = todayDeposits.data as unknown as Array<{ amount?: number }> | null;
                const totalGroupFunds = (fundsData || []).reduce((sum, g) => sum + (g.fund_balance || 0), 0);
                const totalSavings = (savingsData || []).reduce((sum, m) => sum + (m.savings_balance || 0), 0);
                const dailyDeposits = (depositsData || []).reduce((sum, t) => sum + (t.amount || 0), 0);
                // For count queries, the count is not in data but may need fallback
                const issuesCount = (reconciliationIssues as any)?.count || 0;

                setStats({
                    totalMembers: membersCount.data?.count || 0,
                    activeMembers: activeMembersCount.data?.count || 0,
                    activeGroups: activeGroupsCount.data?.count || 0,
                    totalGroupFunds,
                    totalSavings,
                    outstandingLoans: 0,
                    tokenSupply: 0,
                    dailyDeposits,
                    reconciliationStatus: issuesCount > 0 ? 'Issues' : 'Balanced',
                });
            } catch (err: any) {
                console.error('Unexpected error in stats fetch:', err);
                setError('Failed to load dashboard statistics.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [institutionId]);

    return { stats, loading, error };
}
