/**
 * Settings Service
 * 
 * Encapsulates all settings-related data operations with typed error handling.
 */

import { supabase } from '@/core/config/supabase';
import {
    AppError,
    SupabaseError,
    NotFoundError,
    ValidationError,
    createAppError
} from '@/core/errors';

// ============================================================================
// Types
// ============================================================================

export interface InstitutionSettings {
    id: string;
    name: string;
    type: 'BANK' | 'MFI' | 'SACCO';
    currency: string;
    timezone: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    settings: {
        defaultContributionAmount?: number;
        loanInterestRate?: number;
        maxLoanMultiplier?: number;
        requireApprovalForWithdrawals?: boolean;
        enableSmsNotifications?: boolean;
        enableEmailNotifications?: boolean;
    };
}

export interface StaffMember {
    id: string;
    userId: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'STAFF';
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    lastLoginAt?: string;
}

export interface SmsSource {
    id: string;
    name: string;
    senderPattern: string;
    messagePattern: string;
    enabled: boolean;
    transactionType: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
}

// ============================================================================
// Service Implementation
// ============================================================================

export const settingsService = {
    /**
     * Get institution settings
     */
    async getInstitutionSettings(institutionId: string): Promise<InstitutionSettings> {
        try {
            if (!institutionId) {
                throw new ValidationError('Institution ID is required');
            }

            const { data, error } = await supabase
                .from('institutions')
                .select('*')
                .eq('id', institutionId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new NotFoundError('Institution', institutionId);
                }
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return {
                id: data.id,
                name: data.name,
                type: data.type,
                currency: data.currency || 'RWF',
                timezone: data.timezone || 'Africa/Kigali',
                logoUrl: data.logo_url,
                address: data.address,
                phone: data.phone,
                email: data.email,
                taxId: data.tax_id,
                settings: data.settings || {},
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'settingsService.getInstitutionSettings');
        }
    },

    /**
     * Update institution settings
     */
    async updateInstitutionSettings(
        institutionId: string,
        updates: Partial<Omit<InstitutionSettings, 'id'>>
    ): Promise<InstitutionSettings> {
        try {
            if (!institutionId) {
                throw new ValidationError('Institution ID is required');
            }

            const dbUpdates: Record<string, unknown> = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
            if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
            if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
            if (updates.email !== undefined) dbUpdates.email = updates.email;
            if (updates.taxId !== undefined) dbUpdates.tax_id = updates.taxId;
            if (updates.settings !== undefined) dbUpdates.settings = updates.settings;

            const { data, error } = await supabase
                .from('institutions')
                .update(dbUpdates)
                .eq('id', institutionId)
                .select()
                .single();

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return this.getInstitutionSettings(institutionId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'settingsService.updateInstitutionSettings');
        }
    },

    /**
     * Get staff members for an institution
     */
    async getStaffMembers(institutionId: string): Promise<StaffMember[]> {
        try {
            if (!institutionId) {
                throw new ValidationError('Institution ID is required');
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('id, user_id, email, full_name, role, status, created_at, last_login_at')
                .eq('institution_id', institutionId)
                .order('full_name', { ascending: true });

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return (data || []).map((profile) => ({
                id: profile.id,
                userId: profile.user_id,
                email: profile.email,
                fullName: profile.full_name,
                role: profile.role,
                status: profile.status || 'ACTIVE',
                createdAt: profile.created_at,
                lastLoginAt: profile.last_login_at,
            }));
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'settingsService.getStaffMembers');
        }
    },

    /**
     * Get SMS sources configuration
     */
    async getSmsSources(institutionId: string): Promise<SmsSource[]> {
        try {
            if (!institutionId) {
                throw new ValidationError('Institution ID is required');
            }

            const { data, error } = await supabase
                .from('sms_sources')
                .select('*')
                .eq('institution_id', institutionId)
                .order('name', { ascending: true });

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return (data || []).map((source) => ({
                id: source.id,
                name: source.name,
                senderPattern: source.sender_pattern,
                messagePattern: source.message_pattern,
                enabled: source.enabled,
                transactionType: source.transaction_type,
            }));
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'settingsService.getSmsSources');
        }
    },

    /**
     * Get audit log entries
     */
    async getAuditLog(
        institutionId: string,
        options: { limit?: number; offset?: number } = {}
    ): Promise<AuditLogEntry[]> {
        try {
            if (!institutionId) {
                throw new ValidationError('Institution ID is required');
            }

            let query = supabase
                .from('audit_log')
                .select('*')
                .eq('institution_id', institutionId)
                .order('timestamp', { ascending: false });

            if (options.limit) {
                query = query.limit(options.limit);
            }
            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
            }

            const { data, error } = await query;

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return (data || []).map((entry) => ({
                id: entry.id,
                timestamp: entry.timestamp,
                userId: entry.user_id,
                userName: entry.user_name,
                action: entry.action,
                resourceType: entry.resource_type,
                resourceId: entry.resource_id,
                details: entry.details,
                ipAddress: entry.ip_address,
            }));
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'settingsService.getAuditLog');
        }
    },
};

export default settingsService;
