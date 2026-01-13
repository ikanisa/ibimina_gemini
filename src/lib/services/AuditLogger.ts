/**
 * Audit Logger Service
 * Logs all security-relevant events for compliance and debugging
 */

import { supabase } from '../supabase';
import { captureError } from '../sentry';

// ============================================================================
// TYPES
// ============================================================================

export type AuditAction =
    // Authentication events
    | 'auth.login'
    | 'auth.logout'
    | 'auth.login_failed'
    | 'auth.password_reset_request'
    | 'auth.password_reset_complete'
    | 'auth.password_change'
    | 'auth.session_expired'
    | 'auth.2fa_enabled'
    | 'auth.2fa_disabled'

    // Member operations
    | 'member.create'
    | 'member.update'
    | 'member.delete'
    | 'member.suspend'
    | 'member.activate'

    // Group operations
    | 'group.create'
    | 'group.update'
    | 'group.delete'
    | 'group.member_add'
    | 'group.member_remove'

    // Transaction operations
    | 'transaction.create'
    | 'transaction.approve'
    | 'transaction.reject'
    | 'transaction.reverse'

    // Staff operations
    | 'staff.create'
    | 'staff.update'
    | 'staff.delete'
    | 'staff.role_change'

    // Settings operations
    | 'settings.update'
    | 'settings.security_change'

    // Admin operations
    | 'admin.user_impersonate'
    | 'admin.data_export'
    | 'admin.bulk_operation';

export type AuditResource =
    | 'user'
    | 'member'
    | 'group'
    | 'transaction'
    | 'staff'
    | 'settings'
    | 'institution';

export interface AuditEvent {
    userId: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId: string;
    institutionId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
}

interface AuditLogRecord {
    user_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    institution_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, unknown> | null;
    previous_value: Record<string, unknown> | null;
    new_value: Record<string, unknown> | null;
    created_at: string;
}

// ============================================================================
// AUDIT LOGGER CLASS
// ============================================================================

class AuditLoggerService {
    private queue: AuditLogRecord[] = [];
    private isProcessing = false;
    private readonly batchSize = 10;
    private readonly flushInterval = 5000; // 5 seconds

    constructor() {
        // Start periodic flush
        if (typeof window !== 'undefined') {
            setInterval(() => this.flush(), this.flushInterval);

            // Flush on page unload
            window.addEventListener('beforeunload', () => {
                this.flush();
            });
        }
    }

    /**
     * Log an audit event
     */
    async log(event: AuditEvent): Promise<void> {
        const record: AuditLogRecord = {
            user_id: event.userId,
            action: event.action,
            resource_type: event.resource,
            resource_id: event.resourceId,
            institution_id: event.institutionId ?? null,
            ip_address: event.ipAddress ?? this.getClientIP(),
            user_agent: event.userAgent ?? this.getUserAgent(),
            metadata: event.metadata ?? null,
            previous_value: event.previousValue ?? null,
            new_value: event.newValue ?? null,
            created_at: new Date().toISOString(),
        };

        this.queue.push(record);

        // Flush immediately if queue is full
        if (this.queue.length >= this.batchSize) {
            await this.flush();
        }
    }

    /**
     * Flush queued events to database
     */
    async flush(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const batch = this.queue.splice(0, this.batchSize);

        try {
            const { error } = await supabase
                .from('audit_logs')
                .insert(batch);

            if (error) {
                // Put failed items back in queue
                this.queue.unshift(...batch);
                console.error('[AuditLogger] Failed to flush:', error);

                // Report to Sentry
                captureError(new Error(`Audit log flush failed: ${error.message}`), {
                    batchSize: batch.length,
                });
            }
        } catch (error) {
            // Put failed items back in queue
            this.queue.unshift(...batch);
            console.error('[AuditLogger] Error during flush:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Log authentication event
     */
    async logAuth(
        userId: string,
        action: Extract<AuditAction, `auth.${string}`>,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.log({
            userId,
            action,
            resource: 'user',
            resourceId: userId,
            metadata,
        });
    }

    /**
     * Log member operation
     */
    async logMember(
        userId: string,
        action: Extract<AuditAction, `member.${string}`>,
        memberId: string,
        institutionId: string,
        options?: {
            previousValue?: Record<string, unknown>;
            newValue?: Record<string, unknown>;
            metadata?: Record<string, unknown>;
        }
    ): Promise<void> {
        await this.log({
            userId,
            action,
            resource: 'member',
            resourceId: memberId,
            institutionId,
            ...options,
        });
    }

    /**
     * Log transaction operation
     */
    async logTransaction(
        userId: string,
        action: Extract<AuditAction, `transaction.${string}`>,
        transactionId: string,
        institutionId: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.log({
            userId,
            action,
            resource: 'transaction',
            resourceId: transactionId,
            institutionId,
            metadata,
        });
    }

    /**
     * Log group operation
     */
    async logGroup(
        userId: string,
        action: Extract<AuditAction, `group.${string}`>,
        groupId: string,
        institutionId: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await this.log({
            userId,
            action,
            resource: 'group',
            resourceId: groupId,
            institutionId,
            metadata,
        });
    }

    /**
     * Log settings operation
     */
    async logSettings(
        userId: string,
        action: Extract<AuditAction, `settings.${string}`>,
        institutionId: string,
        options?: {
            previousValue?: Record<string, unknown>;
            newValue?: Record<string, unknown>;
        }
    ): Promise<void> {
        await this.log({
            userId,
            action,
            resource: 'settings',
            resourceId: institutionId,
            institutionId,
            ...options,
        });
    }

    /**
     * Get client IP (limited in browser context)
     */
    private getClientIP(): string | null {
        // In browser context, we can't reliably get client IP
        // This would be set by the server/edge function
        return null;
    }

    /**
     * Get user agent
     */
    private getUserAgent(): string | null {
        if (typeof navigator !== 'undefined') {
            return navigator.userAgent;
        }
        return null;
    }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const AuditLogger = new AuditLoggerService();

export default AuditLogger;
