/**
 * Messaging Feature Types
 */

export interface MemberStatement {
    member: {
        id: string;
        full_name: string;
        phone: string;
        email?: string;
        national_id?: string;
    };
    savings: {
        current_balance: number;
        total_contributions: number;
        contribution_count: number;
        last_contribution_date?: string;
        last_contribution_amount?: number;
        expected_total?: number;
        arrears: number;
    };
    loans: {
        active_loan_balance: number;
        total_loans_taken: number;
        total_loans_repaid: number;
        loans_count: number;
        has_active_loan: boolean;
        active_loan_details?: {
            principal: number;
            interest_rate: number;
            monthly_payment: number;
            next_payment_due?: string;
            overdue_amount: number;
        };
    };
    groups: Array<{
        id: string;
        name: string;
        role: string;
        joined_at: string;
        contribution_frequency: string;
        expected_amount: number;
    }>;
    recent_transactions: Array<{
        id: string;
        type: string;
        amount: number;
        date: string;
        group_name?: string;
        status: string;
    }>;
    currency: string;
    generated_at: string;
}

export interface GroupReportData {
    group: {
        id: string;
        name: string;
        total_members: number;
        active_members: number;
    };
    period: {
        start: string;
        end: string;
        type: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
    };
    summary: {
        total_contributions: number;
        expected_contributions: number;
        collection_rate: number;
        total_arrears: number;
        active_loans: number;
        loan_balance: number;
    };
    member_contributions: Array<{
        member_id: string;
        member_name: string;
        phone: string;
        period_total: number;
        overall_total: number;
        arrears: number;
    }>;
    currency: string;
    generated_at: string;
}

export type MessageType =
    | 'MEMBER_STATEMENT'
    | 'GROUP_REPORT'
    | 'CUSTOM_MESSAGE';

export interface WhatsAppMessageRequest {
    recipientType: 'MEMBER' | 'LEADER' | 'GROUP_ALL';
    recipientId: string;
    recipientPhone: string;
    recipientName: string;
    messageType: MessageType;
    message: string;
    attachPdf?: boolean;
    pdfUrl?: string;
    pdfFilename?: string;
}

export interface MessageSendResult {
    success: boolean;
    messageId?: string;
    logId?: string;
    error?: string;
    sentAt?: string;
}
