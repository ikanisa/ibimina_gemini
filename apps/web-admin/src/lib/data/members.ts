/**
 * Domain data layer: Members
 * Provides typed functions for accessing members table
 */
import { supabase } from '../supabase';
import type { SupabaseMember } from '../../types';

export interface ListMembersParams {
    institutionId?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
}

export interface MembersResult {
    data: SupabaseMember[];
    error: string | null;
    count: number | null;
}

/**
 * List members with optional filtering
 */
export async function listMembers(params: ListMembersParams = {}): Promise<MembersResult> {
    const { institutionId, search, status, limit = 50, offset = 0 } = params;

    try {
        let query = supabase
            .from('members')
            .select('*', { count: 'exact' })
            .order('full_name', { ascending: true })
            .range(offset, offset + limit - 1);

        if (institutionId) {
            query = query.eq('institution_id', institutionId);
        }

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching members:', error);
            return { data: [], error: error.message, count: null };
        }

        return {
            data: (data ?? []) as SupabaseMember[],
            error: null,
            count
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: [], error: message, count: null };
    }
}

/**
 * Get a single member by ID
 */
export async function getMember(id: string): Promise<{ data: SupabaseMember | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: data as SupabaseMember, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}

/**
 * Get member with their group memberships
 */
export async function getMemberWithGroups(id: string): Promise<{
    data: SupabaseMember & { groups: { group_id: string; role: string; status: string }[] } | null;
    error: string | null;
}> {
    try {
        const [memberResult, groupsResult] = await Promise.all([
            supabase.from('members').select('*').eq('id', id).single(),
            supabase.from('group_members').select('group_id, role, status').eq('member_id', id)
        ]);

        if (memberResult.error) {
            return { data: null, error: memberResult.error.message };
        }

        return {
            data: {
                ...(memberResult.data as SupabaseMember),
                groups: (groupsResult.data ?? []) as { group_id: string; role: string; status: string }[]
            },
            error: null
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}

/**
 * Create a new member
 */
export async function createMember(
    data: Omit<SupabaseMember, 'id' | 'created_at'>
): Promise<{ data: SupabaseMember | null; error: string | null }> {
    try {
        const { data: created, error } = await supabase
            .from('members')
            .insert(data)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: created as SupabaseMember, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}

/**
 * Update a member
 */
export async function updateMember(
    id: string,
    data: Partial<Omit<SupabaseMember, 'id' | 'created_at'>>
): Promise<{ data: SupabaseMember | null; error: string | null }> {
    try {
        const { data: updated, error } = await supabase
            .from('members')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: updated as SupabaseMember, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}
