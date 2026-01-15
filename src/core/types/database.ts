/**
 * Database Types - Supabase table type definitions
 * 
 * These types map directly to Supabase database tables and RLS policies.
 * Use these for database operations and API responses.
 */

// ============================================================================
// ENUMS & STATUS TYPES
// ============================================================================

export type UserRole = 'ADMIN' | 'STAFF';
export type InstitutionType = 'BANK' | 'MFI' | 'SACCO' | 'VC';
export type GroupStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type ContributionStatus = 'RECORDED' | 'RECONCILED' | 'FLAGGED';
export type PaymentStatus = 'UNRECONCILED' | 'RECONCILED' | 'FLAGGED';
export type WithdrawalStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
export type TransactionDbStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
export type AllocationStatus = 'unallocated' | 'allocated' | 'flagged' | 'duplicate';
export type ReconciliationIssueStatus = 'OPEN' | 'RESOLVED' | 'IGNORED';
export type ProfileStatus = 'ACTIVE' | 'SUSPENDED';
export type MeetingStatus = 'SCHEDULED' | 'COMPLETED';
export type GroupMemberRole = 'CHAIRPERSON' | 'SECRETARY' | 'TREASURER' | 'LEADER' | 'MEMBER';
export type GroupMemberStanding = 'GOOD_STANDING' | 'IN_ARREARS' | 'DEFAULTED';

// ============================================================================
// AUTH & PROFILE TYPES
// ============================================================================

export interface AuthUser {
    id: string;
    email?: string;
    user_metadata?: {
        institutionId?: string;
        role?: UserRole;
    };
}

export interface SupabaseProfile {
    user_id: string;
    institution_id: string | null;
    role: UserRole;
    email?: string | null;
    full_name?: string | null;
    branch?: string | null;
    avatar_url?: string | null;
    status?: ProfileStatus;
    last_login_at?: string | null;
}

// ============================================================================
// INSTITUTION & SETTINGS
// ============================================================================

export interface Institution {
    id: string;
    name: string;
    type: InstitutionType;
    status: string;
    code?: string | null;
    supervisor?: string | null;
    total_assets?: number | null;
    // Contact & location fields
    logo_url?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    region?: string | null;
    // MoMo fields
    momo_code?: string | null;
    momo_ussd_code?: string | null;
    additional_momo_codes?: Record<string, unknown>[] | null;
    // Settings fields (consolidated from institution_settings table)
    parsing_mode?: 'deterministic' | 'ai_fallback' | null;
    confidence_threshold?: number | null;
    dedupe_window_minutes?: number | null;
    low_confidence_alert_enabled?: boolean | null;
    unallocated_alert_threshold?: number | null;
    created_at: string;
    updated_at?: string | null;
}

export interface SupabaseSettings {
    institution_id: string;
    system_name: string;
    support_email?: string | null;
    base_currency: string;
    momo_shortcode?: string | null;
    momo_merchant_id?: string | null;
    auto_reconcile: boolean;
    notifications_enabled: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// GROUPS & MEMBERS
// ============================================================================

export interface SupabaseGroup {
    id: string;
    institution_id: string;
    group_name: string;
    status: GroupStatus;
    expected_amount: number;
    frequency: string;
    grace_days: number;
    bank_name?: string;
    account_ref?: string;
    currency: string;
    meeting_day?: string | null;
    cycle_label?: string | null;
    fund_balance?: number | null;
    active_loans_count?: number | null;
    next_meeting_date?: string | null;
    members?: any[]; // JSONB array from consolidated group_members table
    created_at: string;
    updated_at: string;
}

export interface SupabaseMember {
    id: string;
    institution_id: string;
    full_name: string;
    phone: string;
    status: string;
    branch?: string | null;
    kyc_status?: 'Verified' | 'Pending' | 'Rejected';
    savings_balance?: number | null;
    loan_balance?: number | null;
    token_balance?: number | null;
    avatar_url?: string | null;
    join_date?: string | null;
    created_at: string;
}

// DEPRECATED: group_members table consolidated into groups.members JSONB
// This interface is kept for backward compatibility with existing code
export interface SupabaseGroupMember {
    id: string;
    institution_id: string;
    group_id: string;
    member_id: string;
    role: GroupMemberRole;
    status: GroupMemberStanding;
    joined_date?: string | null;
    created_at: string;
}

// ============================================================================
// TRANSACTIONS & PAYMENTS
// ============================================================================

export interface SupabaseTransaction {
    id: string;
    institution_id: string;
    member_id?: string | null;
    group_id?: string | null;
    type: string;
    amount: number;
    currency: string;
    channel: string;
    status: TransactionDbStatus;
    reference?: string | null;
    // MoMo SMS/transaction fields
    occurred_at?: string;
    payer_name?: string | null;
    payer_phone?: string | null;
    momo_ref?: string | null;
    allocation_status?: AllocationStatus;
    created_at: string;
}

export interface SupabaseContribution {
    id: string;
    institution_id: string;
    group_id: string;
    member_id: string;
    meeting_id?: string | null;
    date: string;
    amount: number;
    method: string;
    channel?: string | null;
    reference: string;
    status: ContributionStatus;
    created_by: string;
    created_at: string;
}

export interface IncomingPayment {
    id: string;
    institution_id: string;
    received_date: string;
    amount: number;
    payer_ref: string;
    reference: string;
    raw_text?: string;
    status: PaymentStatus;
    created_at: string;
}

export interface Withdrawal {
    id: string;
    institution_id: string;
    group_id: string;
    member_id?: string;
    request_date: string;
    amount: number;
    status: WithdrawalStatus;
    payment_reference?: string;
    notes?: string;
    created_by: string;
    created_at: string;
}

// ============================================================================
// SMS & RECONCILIATION
// ============================================================================

export interface SupabaseSmsMessage {
    id: string;
    institution_id: string;
    sender: string;
    timestamp: string;
    body: string;
    is_parsed: boolean;
    parsed_amount?: number | null;
    parsed_currency?: string | null;
    parsed_transaction_id?: string | null;
    parsed_counterparty?: string | null;
    linked_transaction_id?: string | null;
    created_at: string;
}

export interface SupabaseReconciliationIssue {
    id: string;
    institution_id: string;
    source: string;
    amount: number;
    source_reference?: string | null;
    ledger_status: string;
    status: ReconciliationIssueStatus;
    detected_at: string;
    resolved_at?: string | null;
    notes?: string | null;
    linked_transaction_id?: string | null;
}

// ============================================================================
// DEPRECATED TYPES (kept for backward compatibility)
// ============================================================================

// DEPRECATED: meetings table deleted
export interface SupabaseMeeting {
    id: string;
    institution_id: string;
    group_id: string;
    date: string;
    type: string;
    attendance_count: number;
    total_collected: number;
    notes?: string | null;
    status: MeetingStatus;
    created_at: string;
}

// DEPRECATED: branches table deleted
export interface SupabaseBranch {
    id: string;
    institution_id: string;
    name: string;
    manager_name?: string | null;
    manager_phone?: string | null;
    status: string;
    created_at: string;
}


// Consolidated Transaction type for the unified Transactions page
export interface ConsolidatedTransaction {
    id: string;
    institution_id: string;
    occurred_at: string;
    created_at: string;
    amount: number;
    currency: string;
    payer_phone: string | null;
    payer_name: string | null;
    momo_ref: string | null;
    transaction_type: string;
    channel: string;
    transaction_status: string;
    allocation_status: 'unallocated' | 'allocated' | 'error' | 'duplicate' | 'reversed' | 'flagged';
    member_id: string | null;
    group_id: string | null;
    parse_confidence: number | null;
    // Allocation tracking
    allocated_by: string | null;
    allocated_at: string | null;
    allocation_note: string | null;
    // SMS info
    sms_id: string | null;
    sms_text: string | null;
    sender_phone: string | null;
    sms_received_at: string | null;
    parse_status: 'pending' | 'success' | 'error' | null;
    parse_error: string | null;
    sms_source: string | null;
    // Allocation info
    member_name: string | null;
    member_phone: string | null;
    member_balance: number | null;
    group_name: string | null;
    group_balance: number | null;
    allocated_by_name: string | null;
}

