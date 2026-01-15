/**
 * Report Service
 * 
 * Encapsulates all report-related data operations with typed error handling.
 */

import { supabase } from '@/core/config/supabase';
import {
    AppError,
    SupabaseError,
    ValidationError,
    createAppError
} from '@/core/errors';

// ============================================================================
// Types
// ============================================================================

export interface ReportFilters {
    institutionId: string;
    startDate: string;
    endDate: string;
    groupId?: string;
    memberId?: string;
}

export interface ReportSummary {
    totalDeposits: number;
    totalWithdrawals: number;
    netSavings: number;
    totalLoansIssued: number;
    totalLoanRepayments: number;
    activeMembers: number;
    transactionCount: number;
}

export interface ReportBreakdown {
    id: string;
    name: string;
    deposits: number;
    withdrawals: number;
    net: number;
    transactionCount: number;
}

export interface LedgerEntry {
    id: string;
    date: string;
    type: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    reference?: string;
}

// ============================================================================
// Service Implementation
// ============================================================================

export const reportService = {
    /**
     * Generate institution-level report summary
     */
    async getInstitutionSummary(filters: ReportFilters): Promise<ReportSummary> {
        try {
            if (!filters.institutionId) {
                throw new ValidationError('Institution ID is required');
            }
            if (!filters.startDate || !filters.endDate) {
                throw new ValidationError('Date range is required');
            }

            // Fetch transactions in date range
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('type, amount, status')
                .eq('institution_id', filters.institutionId)
                .gte('occurred_at', `${filters.startDate}T00:00:00`)
                .lte('occurred_at', `${filters.endDate}T23:59:59`)
                .eq('status', 'COMPLETED');

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            // Calculate totals
            let totalDeposits = 0;
            let totalWithdrawals = 0;
            let totalLoansIssued = 0;
            let totalLoanRepayments = 0;

            (transactions || []).forEach((txn) => {
                const amount = txn.amount || 0;
                switch (txn.type) {
                    case 'DEPOSIT':
                    case 'SAVINGS':
                        totalDeposits += amount;
                        break;
                    case 'WITHDRAWAL':
                        totalWithdrawals += amount;
                        break;
                    case 'LOAN_DISBURSEMENT':
                        totalLoansIssued += amount;
                        break;
                    case 'LOAN_REPAYMENT':
                        totalLoanRepayments += amount;
                        break;
                }
            });

            // Get active member count
            const { count: activeMembers } = await supabase
                .from('members')
                .select('*', { count: 'exact', head: true })
                .eq('institution_id', filters.institutionId)
                .eq('status', 'ACTIVE');

            return {
                totalDeposits,
                totalWithdrawals,
                netSavings: totalDeposits - totalWithdrawals,
                totalLoansIssued,
                totalLoanRepayments,
                activeMembers: activeMembers || 0,
                transactionCount: transactions?.length || 0,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'reportService.getInstitutionSummary');
        }
    },

    /**
     * Get breakdown by group
     */
    async getGroupBreakdown(filters: ReportFilters): Promise<ReportBreakdown[]> {
        try {
            if (!filters.institutionId) {
                throw new ValidationError('Institution ID is required');
            }

            // Fetch groups with their transaction totals
            const { data: groups, error: groupsError } = await supabase
                .from('groups')
                .select('id, name')
                .eq('institution_id', filters.institutionId)
                .eq('status', 'ACTIVE');

            if (groupsError) {
                throw new SupabaseError(groupsError.message, groupsError.code, groupsError.hint);
            }

            // For each group, calculate totals
            const breakdown: ReportBreakdown[] = await Promise.all(
                (groups || []).map(async (group) => {
                    const { data: transactions } = await supabase
                        .from('transactions')
                        .select('type, amount')
                        .eq('group_id', group.id)
                        .gte('occurred_at', `${filters.startDate}T00:00:00`)
                        .lte('occurred_at', `${filters.endDate}T23:59:59`)
                        .eq('status', 'COMPLETED');

                    let deposits = 0;
                    let withdrawals = 0;

                    (transactions || []).forEach((txn) => {
                        if (txn.type === 'DEPOSIT' || txn.type === 'SAVINGS') {
                            deposits += txn.amount || 0;
                        } else if (txn.type === 'WITHDRAWAL') {
                            withdrawals += txn.amount || 0;
                        }
                    });

                    return {
                        id: group.id,
                        name: group.name,
                        deposits,
                        withdrawals,
                        net: deposits - withdrawals,
                        transactionCount: transactions?.length || 0,
                    };
                })
            );

            return breakdown.sort((a, b) => b.net - a.net);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'reportService.getGroupBreakdown');
        }
    },

    /**
     * Get ledger entries for a member
     */
    async getMemberLedger(
        memberId: string,
        filters: Pick<ReportFilters, 'startDate' | 'endDate'>
    ): Promise<LedgerEntry[]> {
        try {
            if (!memberId) {
                throw new ValidationError('Member ID is required');
            }

            const { data, error } = await supabase
                .from('transactions')
                .select('id, occurred_at, type, amount, reference, payer_name')
                .eq('member_id', memberId)
                .gte('occurred_at', `${filters.startDate}T00:00:00`)
                .lte('occurred_at', `${filters.endDate}T23:59:59`)
                .order('occurred_at', { ascending: true });

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            // Transform to ledger format with running balance
            let balance = 0;
            const entries: LedgerEntry[] = (data || []).map((txn) => {
                const isDebit = txn.type === 'WITHDRAWAL' || txn.type === 'LOAN_DISBURSEMENT';
                const debit = isDebit ? txn.amount : 0;
                const credit = isDebit ? 0 : txn.amount;
                balance += credit - debit;

                return {
                    id: txn.id,
                    date: txn.occurred_at,
                    type: txn.type,
                    description: txn.payer_name || txn.type,
                    debit,
                    credit,
                    balance,
                    reference: txn.reference,
                };
            });

            return entries;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'reportService.getMemberLedger');
        }
    },

    /**
     * Export report data as CSV-ready format
     */
    async exportToCSV(filters: ReportFilters): Promise<string> {
        try {
        const { data, error } = await supabase
                .from('transactions')
                .select(`
          id,
          occurred_at,
          type,
          amount,
          status,
          payer_name,
          reference,
          members:members!transactions_member_id_fkey(full_name),
          groups(name)
        `)
                .eq('institution_id', filters.institutionId)
                .gte('occurred_at', `${filters.startDate}T00:00:00`)
                .lte('occurred_at', `${filters.endDate}T23:59:59`)
                .order('occurred_at', { ascending: false });

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            // Convert to CSV format
            const headers = ['Date', 'Type', 'Amount', 'Status', 'Member', 'Group', 'Reference'];
            const rows = (data || []).map((txn: any) => [
                new Date(txn.occurred_at).toLocaleDateString(),
                txn.type,
                txn.amount,
                txn.status,
                txn.members?.full_name || '',
                txn.groups?.name || '',
                txn.reference || '',
            ]);

            const csv = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
            ].join('\n');

            return csv;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'reportService.exportToCSV');
        }
    },
};

export default reportService;
