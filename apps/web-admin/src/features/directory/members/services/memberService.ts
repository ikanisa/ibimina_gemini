/**
 * Member Service
 * 
 * Encapsulates all member-related data operations with typed error handling.
 */

import { supabase } from '@/core/config/supabase';
import type { SupabaseMember, Member } from '@/core/types';
import {
    AppError,
    SupabaseError,
    NotFoundError,
    ValidationError,
    ConflictError,
    createAppError
} from '@/core/errors';

// ============================================================================
// Types
// ============================================================================

export interface MemberFilters {
    institutionId: string;
    groupId?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    searchTerm?: string;
    limit?: number;
    offset?: number;
}

export interface CreateMemberInput {
    institutionId: string;
    groupId?: string;
    fullName: string;
    phone?: string;
    email?: string;
    nationalId?: string;
    dateOfBirth?: string;
}

export interface UpdateMemberInput {
    fullName?: string;
    phone?: string;
    email?: string;
    groupId?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    nationalId?: string;
}

export interface GroupMembership {
    group_id: string;
    role: string;
    status: string;
    groups: { id: string; group_name: string } | null;
}

export type MemberWithGroup = SupabaseMember & {
    groups?: { id: string; name: string }; // Legacy, kept for compatibility
    group_memberships?: GroupMembership[];
};

// ============================================================================
// Service Implementation
// ============================================================================

export const memberService = {
    /**
     * Fetch members with optional filters
     */
    async getAll(filters: MemberFilters): Promise<MemberWithGroup[]> {
        try {
            if (!filters.institutionId) {
                throw new ValidationError('Institution ID is required');
            }

            // Join through group_members to get all groups a member belongs to
            let query = supabase
                .from('members')
                .select(`
                    *,
                    group_memberships:group_members(
                        group_id,
                        role,
                        status,
                        groups(id, group_name)
                    )
                `)
                .eq('institution_id', filters.institutionId);

            if (filters.groupId) {
                // Filter by group via the junction table
                query = query.eq('group_memberships.group_id', filters.groupId);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.searchTerm?.trim()) {
                const term = filters.searchTerm.trim();
                query = query.or(
                    `full_name.ilike.%${term}%,phone.ilike.%${term}%,member_code.ilike.%${term}%`
                );
            }

            query = query.order('full_name', { ascending: true });

            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset !== undefined) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
            }

            const { data, error } = await query;

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data as MemberWithGroup[];
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'memberService.getAll');
        }
    },


    /**
     * Get a single member by ID
     */
    async getById(id: string): Promise<MemberWithGroup> {
        try {
            if (!id) {
                throw new ValidationError('Member ID is required');
            }

            const { data, error } = await supabase
                .from('members')
                .select('*, groups(id, name)')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new NotFoundError('Member', id);
                }
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data as MemberWithGroup;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'memberService.getById');
        }
    },

    /**
     * Search members by name, phone, or code
     */
    async search(
        institutionId: string,
        query: string,
        limit: number = 10
    ): Promise<MemberWithGroup[]> {
        try {
            if (!institutionId) {
                throw new ValidationError('Institution ID is required');
            }
            if (!query?.trim()) {
                return [];
            }

            const term = query.trim();
            const { data, error } = await supabase
                .from('members')
                .select('id, full_name, phone, member_code, group_id, groups(id, name)')
                .eq('institution_id', institutionId)
                .or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,member_code.ilike.%${term}%`)
                .limit(limit);

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            // Transform Supabase response - groups is returned as array from join
            return (data || []).map((row: any): MemberWithGroup => ({
                ...row,
                groups: Array.isArray(row.groups) ? row.groups[0] || null : row.groups || null,
            }));
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'memberService.search');
        }
    },

    /**
     * Create a new member
     */
    async create(input: CreateMemberInput): Promise<SupabaseMember> {
        try {
            // Validation
            if (!input.institutionId) {
                throw new ValidationError('Institution ID is required');
            }
            if (!input.fullName?.trim()) {
                throw new ValidationError('Full name is required', { fullName: 'Required' });
            }

            // Create the member first
            const { data, error } = await supabase
                .from('members')
                .insert({
                    institution_id: input.institutionId,
                    full_name: input.fullName.trim(),
                    phone: input.phone?.trim(),
                    email: input.email?.trim()?.toLowerCase(),
                    national_id: input.nationalId?.trim(),
                    date_of_birth: input.dateOfBirth,
                    status: 'ACTIVE',
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    // Check which field caused the conflict
                    if (error.message.includes('phone')) {
                        throw new ConflictError('A member with this phone number already exists');
                    }
                    if (error.message.includes('national_id')) {
                        throw new ConflictError('A member with this National ID already exists');
                    }
                    throw new ConflictError('A member with these details already exists');
                }
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            // If groupId is provided, create the group_members relationship
            if (input.groupId && data) {
                const { error: groupMemberError } = await supabase
                    .from('group_members')
                    .insert({
                        institution_id: input.institutionId,
                        group_id: input.groupId,
                        member_id: data.id,
                        role: 'MEMBER',
                        status: 'GOOD_STANDING',
                    });

                if (groupMemberError) {
                    console.error('Error linking member to group:', groupMemberError);
                    // Don't fail the whole operation, just log the error
                    // The member is created, group link can be fixed later
                }
            }

            return data as SupabaseMember;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'memberService.create');
        }
    },

    /**
     * Update a member
     */
    async update(id: string, input: UpdateMemberInput): Promise<SupabaseMember> {
        try {
            if (!id) {
                throw new ValidationError('Member ID is required');
            }

            const updates: Record<string, unknown> = {};
            if (input.fullName !== undefined) updates.full_name = input.fullName.trim();
            if (input.phone !== undefined) updates.phone = input.phone?.trim();
            if (input.email !== undefined) updates.email = input.email?.trim()?.toLowerCase();
            if (input.groupId !== undefined) updates.group_id = input.groupId;
            if (input.status !== undefined) updates.status = input.status;
            if (input.nationalId !== undefined) updates.national_id = input.nationalId?.trim();

            if (Object.keys(updates).length === 0) {
                throw new ValidationError('No fields to update');
            }

            const { data, error } = await supabase
                .from('members')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new NotFoundError('Member', id);
                }
                if (error.code === '23505') {
                    throw new ConflictError('A member with these details already exists');
                }
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data as SupabaseMember;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'memberService.update');
        }
    },

    /**
     * Get member transaction history
     */
    async getTransactions(memberId: string, limit: number = 50): Promise<any[]> {
        try {
            if (!memberId) {
                throw new ValidationError('Member ID is required');
            }

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('member_id', memberId)
                .order('occurred_at', { ascending: false })
                .limit(limit);

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data || [];
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'memberService.getTransactions');
        }
    },

    /**
     * Get member balance summary
     */
    async getBalance(memberId: string): Promise<{
        totalSavings: number;
        totalLoans: number;
        netBalance: number;
    }> {
        try {
            if (!memberId) {
                throw new ValidationError('Member ID is required');
            }

            const { data, error } = await supabase
                .from('transactions')
                .select('type, amount')
                .eq('member_id', memberId)
                .eq('status', 'COMPLETED');

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            let totalSavings = 0;
            let totalLoans = 0;

            (data || []).forEach((txn: any) => {
                if (txn.type === 'DEPOSIT' || txn.type === 'SAVINGS') {
                    totalSavings += txn.amount || 0;
                } else if (txn.type === 'WITHDRAWAL') {
                    totalSavings -= txn.amount || 0;
                } else if (txn.type === 'LOAN_DISBURSEMENT') {
                    totalLoans += txn.amount || 0;
                } else if (txn.type === 'LOAN_REPAYMENT') {
                    totalLoans -= txn.amount || 0;
                }
            });

            return {
                totalSavings: Math.max(0, totalSavings),
                totalLoans: Math.max(0, totalLoans),
                netBalance: totalSavings - totalLoans,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'memberService.getBalance');
        }
    },
};

export default memberService;
