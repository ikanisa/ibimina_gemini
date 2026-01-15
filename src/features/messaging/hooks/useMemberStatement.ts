/**
 * Hook to fetch comprehensive member statement
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { MemberStatement } from '../types';

interface UseMemberStatementResult {
    statement: MemberStatement | null;
    loading: boolean;
    error: string | null;
    fetchStatement: (memberId: string) => Promise<MemberStatement | null>;
}

export function useMemberStatement(): UseMemberStatementResult {
    const [statement, setStatement] = useState<MemberStatement | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatement = useCallback(async (memberId: string): Promise<MemberStatement | null> => {
        setLoading(true);
        setError(null);
        setStatement(null);

        try {
            // Fetch member details
            const { data: member, error: memberError } = await supabase
                .from('members')
                .select(`
          id,
          full_name,
          phone,
          email,
          national_id,
          savings_balance,
          institution_id
        `)
                .eq('id', memberId)
                .single();

            if (memberError || !member) {
                throw new Error('Member not found');
            }

            // Fetch group memberships
            const { data: groupMemberships, error: groupError } = await supabase
                .from('group_members')
                .select(`
          role_in_group,
          joined_at,
          group:groups (
            id,
            group_name,
            frequency,
            expected_amount,
            currency
          )
        `)
                .eq('member_id', memberId)
                .eq('status', 'GOOD_STANDING');

            if (groupError) {
                console.error('Error fetching groups:', groupError);
            }

            // Fetch recent transactions
            const { data: transactions, error: txError } = await supabase
                .from('transactions')
                .select(`
          id,
          transaction_type,
          amount,
          created_at,
          status,
          group:groups(group_name)
        `)
                .eq('member_id', memberId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (txError) {
                console.error('Error fetching transactions:', txError);
            }

            // Calculate totals
            const { data: totals, error: totalsError } = await supabase
                .from('transactions')
                .select('amount, transaction_type, created_at')
                .eq('member_id', memberId)
                .eq('status', 'ALLOCATED')
                .eq('transaction_type', 'CONTRIBUTION');

            if (totalsError) {
                console.error('Error fetching totals:', totalsError);
            }

            const totalContributions = totals?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
            const lastContribution = totals?.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            // Fetch loan data (if loans table exists)
            let loanData = {
                active_loan_balance: 0,
                total_loans_taken: 0,
                total_loans_repaid: 0,
                loans_count: 0,
                has_active_loan: false,
            };

            try {
                const { data: loans } = await supabase
                    .from('loans')
                    .select('*')
                    .eq('member_id', memberId);

                if (loans && loans.length > 0) {
                    const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'DISBURSED');
                    loanData = {
                        active_loan_balance: activeLoans.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0),
                        total_loans_taken: loans.reduce((sum, l) => sum + (l.principal_amount || 0), 0),
                        total_loans_repaid: loans.reduce((sum, l) => sum + (l.amount_repaid || 0), 0),
                        loans_count: loans.length,
                        has_active_loan: activeLoans.length > 0,
                    };
                }
            } catch {
                // Loans table might not exist
            }

            // Get currency from first group or default
            const currency = (groupMemberships?.[0] as { group?: { currency?: string } })?.group?.currency || 'RWF';

            const statementData: MemberStatement = {
                member: {
                    id: member.id,
                    full_name: member.full_name,
                    phone: member.phone,
                    email: member.email,
                    national_id: member.national_id,
                },
                savings: {
                    current_balance: member.savings_balance || 0,
                    total_contributions: totalContributions,
                    contribution_count: totals?.length || 0,
                    last_contribution_date: lastContribution?.created_at,
                    last_contribution_amount: lastContribution?.amount,
                    arrears: 0, // Would need expected contribution calculation
                },
                loans: loanData,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                groups: ((groupMemberships || []) as any[]).map((gm) => ({
                    id: gm.group?.id || '',
                    name: gm.group?.group_name || '',
                    role: gm.role_in_group,
                    joined_at: gm.joined_at,
                    contribution_frequency: gm.group?.frequency || '',
                    expected_amount: gm.group?.expected_amount || 0,
                })),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                recent_transactions: ((transactions || []) as any[]).map((tx) => ({
                    id: tx.id,
                    type: tx.transaction_type,
                    amount: tx.amount,
                    date: tx.created_at,
                    group_name: tx.group?.group_name,
                    status: tx.status,
                })),
                currency,
                generated_at: new Date().toISOString(),
            };

            setStatement(statementData);
            return statementData;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch statement';
            setError(errorMsg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { statement, loading, error, fetchStatement };
}
