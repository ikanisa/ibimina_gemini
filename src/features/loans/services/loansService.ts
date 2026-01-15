/**
 * Loans Service
 * API calls for managing loans
 */

import { supabase } from '@/lib/supabase';
import type { Loan, LoanStats } from '../types';

export interface LoansApiResponse {
    loans: Loan[];
    stats: LoanStats;
    error?: string;
}

/**
 * Calculate periodic payment for a loan (simple monthly calculation)
 */
const calculatePeriodicPayment = (principal: number, interestRate: number, termMonths: number): number => {
    if (termMonths === 0) return 0;
    const totalInterest = (principal * interestRate * termMonths) / 100;
    const totalToPay = principal + totalInterest;
    return Math.ceil(totalToPay / termMonths);
};

/**
 * Fetch all loans for the current institution
 */
export async function fetchLoans(institutionId: string): Promise<LoansApiResponse> {
    try {
        const { data: loansData, error: loansError } = await supabase
            .from('loans')
            .select(`
        *,
        members:members!loans_member_id_fkey(id, full_name, phone, savings_balance),
        groups:groups!loans_group_id_fkey(id, group_name)
      `)
            .eq('institution_id', institutionId)
            .order('created_at', { ascending: false });

        if (loansError) {
            console.error('Error fetching loans:', loansError);
            return { loans: [], stats: emptyStats(), error: loansError.message };
        }

        const loans: Loan[] = (loansData || []).map((loan: any) => {
            const principal = Number(loan.amount) || 0;
            const outstanding = Number(loan.outstanding_balance) || 0;
            const rate = Number(loan.interest_rate) || 0;
            const term = loan.term_months || 0;
            const totalInterest = (principal * rate * term) / 100;
            const totalToPay = principal + totalInterest;
            const periodicPayment = calculatePeriodicPayment(principal, rate, term);

            return {
                id: loan.id,
                memberId: loan.member_id || '',
                memberName: loan.members?.full_name || 'Unknown Member',
                memberPhone: loan.members?.phone || undefined,
                memberSavingsBalance: Number(loan.members?.savings_balance) || 0,
                groupId: loan.group_id || '',
                groupName: loan.groups?.group_name || 'Unknown Group',
                principalAmount: principal,
                outstandingBalance: outstanding,
                interestRate: rate,
                termMonths: term,
                periodicPayment,
                totalToPay,
                expectedInterest: totalInterest,
                issueDate: loan.start_date || loan.created_at,
                nextPaymentDate: loan.next_payment_date || null,
                status: loan.status,
                createdAt: loan.created_at,
            };
        });

        // Calculate stats
        const stats: LoanStats = {
            totalLoans: loans.length,
            activeLoans: loans.filter(l => l.status === 'ACTIVE').length,
            totalDisbursed: loans.reduce((sum, l) => sum + l.principalAmount, 0),
            totalOutstanding: loans.reduce((sum, l) => sum + l.outstandingBalance, 0),
            totalExpectedInterest: loans.reduce((sum, l) => sum + l.expectedInterest, 0),
        };

        return { loans, stats };
    } catch (err) {
        console.error('Unexpected error fetching loans:', err);
        return { loans: [], stats: emptyStats(), error: 'Failed to fetch loans' };
    }
}

function emptyStats(): LoanStats {
    return {
        totalLoans: 0,
        activeLoans: 0,
        totalDisbursed: 0,
        totalOutstanding: 0,
        totalExpectedInterest: 0,
    };
}
