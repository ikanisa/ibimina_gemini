/**
 * Group Service
 * 
 * Encapsulates all group-related data operations with typed error handling.
 */

import { supabase } from '@/core/config/supabase';
import type { SupabaseGroup, Group } from '@/core/types';
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

export interface GroupFilters {
    institutionId: string;
    status?: 'ACTIVE' | 'PAUSED' | 'CLOSED';
    searchTerm?: string;
    limit?: number;
    offset?: number;
}

export interface CreateGroupInput {
    institutionId: string;
    name: string;
    description?: string;
    meetingDay?: string;
    meetingFrequency?: string;
    contributionAmount?: number;
    currency?: string;
}

export interface UpdateGroupInput {
    name?: string;
    description?: string;
    status?: 'ACTIVE' | 'PAUSED' | 'CLOSED';
    meetingDay?: string;
    meetingFrequency?: string;
    contributionAmount?: number;
}

export type GroupWithMemberCount = SupabaseGroup & {
    member_count?: number;
};

// ============================================================================
// Service Implementation
// ============================================================================

export const groupService = {
    /**
     * Fetch groups with optional filters
     */
    async getAll(filters: GroupFilters): Promise<GroupWithMemberCount[]> {
        try {
            if (!filters.institutionId) {
                throw new ValidationError('Institution ID is required');
            }

            let query = supabase
                .from('groups')
                .select('*, members(count)')
                .eq('institution_id', filters.institutionId);

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.searchTerm?.trim()) {
                query = query.ilike('name', `%${filters.searchTerm.trim()}%`);
            }

            query = query.order('name', { ascending: true });

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

            // Transform to include member count
            return (data || []).map((group: any) => ({
                ...group,
                member_count: group.members?.[0]?.count || 0,
            }));
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'groupService.getAll');
        }
    },

    /**
     * Get a single group by ID with full details
     */
    async getById(id: string): Promise<GroupWithMemberCount> {
        try {
            if (!id) {
                throw new ValidationError('Group ID is required');
            }

            const { data, error } = await supabase
                .from('groups')
                .select('*, members(count)')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new NotFoundError('Group', id);
                }
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return {
                ...data,
                member_count: (data as any).members?.[0]?.count || 0,
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'groupService.getById');
        }
    },

    /**
     * Create a new group
     */
    async create(input: CreateGroupInput): Promise<SupabaseGroup> {
        try {
            // Validation
            if (!input.institutionId) {
                throw new ValidationError('Institution ID is required');
            }
            if (!input.name?.trim()) {
                throw new ValidationError('Group name is required', { name: 'Required' });
            }

            const { data, error } = await supabase
                .from('groups')
                .insert({
                    institution_id: input.institutionId,
                    name: input.name.trim(),
                    description: input.description?.trim(),
                    meeting_day: input.meetingDay,
                    meeting_frequency: input.meetingFrequency,
                    contribution_amount: input.contributionAmount,
                    currency: input.currency || 'RWF',
                    status: 'ACTIVE',
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    throw new ConflictError('A group with this name already exists');
                }
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data as SupabaseGroup;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'groupService.create');
        }
    },

    /**
     * Update a group
     */
    async update(id: string, input: UpdateGroupInput): Promise<SupabaseGroup> {
        try {
            if (!id) {
                throw new ValidationError('Group ID is required');
            }

            const updates: Record<string, unknown> = {};
            if (input.name !== undefined) updates.name = input.name.trim();
            if (input.description !== undefined) updates.description = input.description?.trim();
            if (input.status !== undefined) updates.status = input.status;
            if (input.meetingDay !== undefined) updates.meeting_day = input.meetingDay;
            if (input.meetingFrequency !== undefined) updates.meeting_frequency = input.meetingFrequency;
            if (input.contributionAmount !== undefined) updates.contribution_amount = input.contributionAmount;

            if (Object.keys(updates).length === 0) {
                throw new ValidationError('No fields to update');
            }

            const { data, error } = await supabase
                .from('groups')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new NotFoundError('Group', id);
                }
                if (error.code === '23505') {
                    throw new ConflictError('A group with this name already exists');
                }
                throw new SupabaseError(error.message, error.code, error.hint);
            }

            return data as SupabaseGroup;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'groupService.update');
        }
    },

    /**
     * Delete (archive) a group
     */
    async delete(id: string): Promise<void> {
        try {
            if (!id) {
                throw new ValidationError('Group ID is required');
            }

            // Soft delete by setting status to CLOSED
            const { error } = await supabase
                .from('groups')
                .update({ status: 'CLOSED' })
                .eq('id', id);

            if (error) {
                throw new SupabaseError(error.message, error.code, error.hint);
            }
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'groupService.delete');
        }
    },

    /**
     * Get group statistics
     */
    async getStats(groupId: string): Promise<{
        memberCount: number;
        totalContributions: number;
        totalLoans: number;
        lastMeetingDate: string | null;
    }> {
        try {
            const [memberResult, contributionResult] = await Promise.all([
                supabase
                    .from('members')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', groupId),
                supabase
                    .from('contributions')
                    .select('amount')
                    .eq('group_id', groupId),
            ]);

            const totalContributions = (contributionResult.data || [])
                .reduce((sum, c: any) => sum + (c.amount || 0), 0);

            return {
                memberCount: memberResult.count || 0,
                totalContributions,
                totalLoans: 0, // Would need loans table
                lastMeetingDate: null, // Would need meetings table
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw createAppError(error, 'groupService.getStats');
        }
    },
};

export default groupService;
