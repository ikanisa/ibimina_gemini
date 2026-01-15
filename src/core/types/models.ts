/**
 * Application Models - Domain types for the application layer
 * 
 * These types represent the application's domain models, which may differ
 * from database types (e.g., using camelCase, transformed values, etc.)
 */

// ============================================================================
// STATUS & ENUM TYPES
// ============================================================================

export type Status = 'Active' | 'Pending' | 'Suspended' | 'Closed';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed' | 'Reversed';
export type KycStatus = 'Verified' | 'Pending' | 'Rejected';
export type StaffRole = 'Admin' | 'Staff';
// LoanStatus kept for backward compatibility with mappers
export type LoanStatus = 'Pending Approval' | 'Active' | 'Overdue' | 'Closed' | 'Rejected' | 'Paid' | 'Defaulted';

// ============================================================================
// VIEW STATE
// ============================================================================

export enum ViewState {
    DASHBOARD = 'DASHBOARD',
    GROUPS = 'GROUPS',
    GROUP_DETAILS = 'GROUP_DETAILS',
    INSTITUTIONS = 'INSTITUTIONS',
    MEMBERS = 'MEMBERS',
    TRANSACTIONS = 'TRANSACTIONS',
    REPORTS = 'REPORTS',
    STAFF = 'STAFF',
    SETTINGS = 'SETTINGS',
    PROFILE = 'PROFILE',
    SMS_GATEWAY_DEVICES = 'SMS_GATEWAY_DEVICES',
    // Additional views for SystemHealthIndicator and MemberDetail
    LOANS = 'LOANS',
    ALLOCATION_QUEUE = 'ALLOCATION_QUEUE',
    RECONCILIATION = 'RECONCILIATION',
}

// ============================================================================
// GROUP MODELS
// ============================================================================

export interface Group {
    id: string;
    name: string;
    code: string;
    saccoId: string;
    branch: string;
    status: 'Active' | 'Completed' | 'Suspended';
    cycleLabel: string; // e.g. "Cycle 2024"
    memberCount: number;
    meetingDay: string; // e.g. "Tuesday"
    contributionAmount: number;
    contributionFrequency: 'Weekly' | 'Monthly';
    fundBalance: number;
    activeLoansCount: number;
    nextMeeting: string;
}

export interface GroupMember {
    memberId: string;
    name: string;
    role: 'Chairperson' | 'Secretary' | 'Treasurer' | 'Leader' | 'Member';
    status: 'Good Standing' | 'In Arrears' | 'Defaulted';
    joinedDate: string;
    contributionsPaid: number;
    contributionsMissed: number;
}

export interface Contribution {
    id: string;
    memberId: string;
    groupId: string;
    periodLabel: string; // e.g. "Week 1" or "Jan"
    expectedAmount: number;
    paidAmount: number;
    status: 'Paid' | 'Partial' | 'Missed' | 'Excused';
    channel: 'Cash' | 'MoMo' | 'Token';
}

// ============================================================================
// MEMBER MODELS
// ============================================================================

export interface Member {
    id: string;
    name: string;
    phone: string;
    branch: string;
    status: Status;
    kycStatus: KycStatus;
    savingsBalance: number;
    loanBalance: number;
    tokenBalance: number;
    joinDate: string;
    avatarUrl: string;
    groups: string[]; // IDs or names of groups they belong to
    groupRoles?: Record<string, string>; // Map of group ID/name to role (LEADER, MEMBER, etc.)
}

// ============================================================================
// TRANSACTION MODELS
// ============================================================================

export interface Transaction {
    id: string;
    date: string;
    memberId: string;
    memberName: string;
    type: 'Deposit' | 'Withdrawal' | 'Loan Repayment' | 'Loan Disbursement' | 'Group Contribution';
    amount: number;
    currency: string;
    channel: 'Cash' | 'MoMo USSD' | 'Bank Transfer' | 'System';
    status: TransactionStatus;
    reference: string;
    groupId?: string;
}

// ============================================================================
// SMS MODELS
// ============================================================================

export interface SmsMessage {
    id: string;
    sender: string;
    timestamp: string;
    body: string;
    isParsed: boolean;
    parsedData?: {
        amount: number;
        currency: string;
        transactionId: string;
        counterparty: string;
    };
    linkedTransactionId?: string;
}

// ============================================================================
// DASHBOARD & STATS MODELS
// ============================================================================

export interface KpiStats {
    totalMembers: number;
    activeMembers: number;
    activeGroups: number;
    totalGroupFunds: number;
    totalSavings: number;
    outstandingLoans: number;
    tokenSupply: number;
    dailyDeposits: number;
    reconciliationStatus: 'Balanced' | 'Pending' | 'Issues';
}

// ============================================================================
// STAFF MODELS
// ============================================================================

export interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: StaffRole;
    branch: string;
    status: 'Active' | 'Suspended';
    lastLogin: string;
    avatarUrl: string;
}
