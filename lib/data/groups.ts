/**
 * Domain data layer: Groups
 * Provides typed functions for accessing groups table
 */
import { supabase } from '../supabase';
import type { SupabaseGroup, SupabaseGroupMember } from '../../types';

export interface ListGroupsParams {
    institutionId?: string;
    search?: string;
    status?: 'ACTIVE' | 'PAUSED' | 'CLOSED';
    limit?: number;
    offset?: number;
}

export interface GroupsResult {
    data: SupabaseGroup[];
    error: string | null;
    count: number | null;
}

/**
 * List groups with optional filtering
 */
export async function listGroups(params: ListGroupsParams = {}): Promise<GroupsResult> {
    const { institutionId, search, status, limit = 50, offset = 0 } = params;

    try {
        let query = supabase
            .from('groups')
            .select('*', { count: 'exact' })
            .order('group_name', { ascending: true })
            .range(offset, offset + limit - 1);

        if (institutionId) {
            query = query.eq('institution_id', institutionId);
        }

        if (search) {
            query = query.ilike('group_name', `%${search}%`);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching groups:', error);
            return { data: [], error: error.message, count: null };
        }

        return {
            data: (data ?? []) as SupabaseGroup[],
            error: null,
            count
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: [], error: message, count: null };
    }
}

/**
 * Get a single group by ID
 */
export async function getGroup(id: string): Promise<{ data: SupabaseGroup | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: data as SupabaseGroup, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}

/**
 * Get group with members
 */
export async function getGroupWithMembers(id: string): Promise<{
    data: SupabaseGroup & { members: SupabaseGroupMember[] } | null;
    error: string | null;
}> {
    try {
        const [groupResult, membersResult] = await Promise.all([
            supabase.from('groups').select('*').eq('id', id).single(),
            supabase.from('group_members').select('*').eq('group_id', id)
        ]);

        if (groupResult.error) {
            return { data: null, error: groupResult.error.message };
        }

        return {
            data: {
                ...(groupResult.data as SupabaseGroup),
                members: (membersResult.data ?? []) as SupabaseGroupMember[]
            },
            error: null
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}

/**
 * Create a new group
 */
export async function createGroup(
    data: Omit<SupabaseGroup, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: SupabaseGroup | null; error: string | null }> {
    try {
        const { data: created, error } = await supabase
            .from('groups')
            .insert(data)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: created as SupabaseGroup, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}

/**
 * Update a group
 */
export async function updateGroup(
    id: string,
    data: Partial<Omit<SupabaseGroup, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: SupabaseGroup | null; error: string | null }> {
    try {
        const { data: updated, error } = await supabase
            .from('groups')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: updated as SupabaseGroup, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}
