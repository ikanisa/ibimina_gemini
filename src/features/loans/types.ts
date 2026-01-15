/**
 * Loans Types
 * Types for the Loans feature module
 */

export interface Loan {
    id: string;
    memberId: string;
    memberName: string;
    memberPhone?: string;
    memberSavingsBalance: number;
    groupId: string;
    groupName: string;
    principalAmount: number;
    outstandingBalance: number;
    interestRate: number;
    termMonths: number;
    periodicPayment: number;
    totalToPay: number;
    expectedInterest: number;
    issueDate: string;
    nextPaymentDate: string | null;
    status: LoanStatus;
    createdAt: string;
}

export type LoanStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'OVERDUE' | 'CLOSED' | 'REJECTED';

export interface LoanFilters {
    status: LoanStatus | 'all';
    groupId: string | 'all';
}

export interface LoanStats {
    totalLoans: number;
    activeLoans: number;
    totalDisbursed: number;
    totalOutstanding: number;
    totalExpectedInterest: number;
}
