/**
 * Shared TypeScript Types for Edge Functions
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    requestId?: string;
}

export interface ApiError {
    success: false;
    error: string;
    code?: string;
    details?: unknown;
    requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface AuditLogEntry {
    actor_user_id: string | null;
    institution_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    metadata?: Record<string, unknown>;
    request_id?: string;
    ip_address?: string;
    user_agent?: string;
}

export type AuditAction =
    | 'invite_staff'
    | 'update_staff'
    | 'suspend_staff'
    | 'bulk_import_groups'
    | 'bulk_import_members'
    | 'generate_report'
    | 'send_whatsapp'
    | 'receive_whatsapp'
    | 'allocate_transaction'
    | 'flag_transaction'
    | 'update_settings'
    | 'sms_ingest'
    | 'sms_parse';

// ============================================================================
// WHATSAPP TYPES
// ============================================================================

export interface WhatsAppMessage {
    to: string;
    message: string;
    documentUrl?: string;
    documentFilename?: string;
    caption?: string;
    templateName?: string;
    templateParams?: string[];
}

export interface WhatsAppSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp?: string;
}

export interface WhatsAppWebhookEntry {
    id: string;
    changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
    value: {
        messaging_product: string;
        metadata: {
            display_phone_number: string;
            phone_number_id: string;
        };
        contacts?: WhatsAppContact[];
        messages?: WhatsAppInboundMessage[];
        statuses?: WhatsAppMessageStatus[];
    };
    field: string;
}

export interface WhatsAppContact {
    profile: {
        name: string;
    };
    wa_id: string;
}

export interface WhatsAppInboundMessage {
    from: string;
    id: string;
    timestamp: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'button' | 'interactive';
    text?: {
        body: string;
    };
    button?: {
        text: string;
        payload: string;
    };
    interactive?: {
        type: string;
        button_reply?: {
            id: string;
            title: string;
        };
        list_reply?: {
            id: string;
            title: string;
            description?: string;
        };
    };
}

export interface WhatsAppMessageStatus {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
    errors?: {
        code: number;
        title: string;
        message: string;
    }[];
}

export interface WhatsAppWebhookPayload {
    object: string;
    entry: WhatsAppWebhookEntry[];
}

// ============================================================================
// DATABASE TYPES (WhatsApp Logs)
// ============================================================================

export interface WhatsAppMessageLog {
    id?: string;
    institution_id: string;
    direction: 'outbound' | 'inbound';
    phone_number: string;
    message_id: string | null;
    message_type: 'text' | 'template' | 'document' | 'image' | 'button' | 'interactive';
    content: string | null;
    template_name?: string | null;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    error_message?: string | null;
    metadata?: Record<string, unknown>;
    request_id?: string;
    created_at?: string;
    updated_at?: string;
}

export interface WhatsAppInboundLog {
    id?: string;
    institution_id: string | null;
    from_phone: string;
    message_id: string;
    message_type: string;
    content: string | null;
    raw_payload: Record<string, unknown>;
    processed: boolean;
    processed_at?: string | null;
    webhook_received_at?: string;
    created_at?: string;
}

// ============================================================================
// BULK IMPORT TYPES
// ============================================================================

export interface BulkImportResult {
    success: boolean;
    totalRows: number;
    successCount: number;
    errorCount: number;
    errors?: Array<{
        row: number;
        error: string;
        data?: Record<string, unknown>;
    }>;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface ReportRequest {
    reportType: 'group_summary' | 'member_statement' | 'institution_summary' | 'transaction_list';
    groupId?: string;
    memberId?: string;
    institutionId: string;
    startDate?: string;
    endDate?: string;
    format?: 'json' | 'csv' | 'pdf';
}

export interface ReportResult {
    success: boolean;
    reportUrl?: string;
    data?: unknown;
    generatedAt?: string;
}
