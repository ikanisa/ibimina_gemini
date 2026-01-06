/**
 * Domain data layer: Institutions
 * Provides typed functions for accessing institutions table
 */
import { supabase } from '../supabase';
import type { Institution } from '../../types';

export interface ListInstitutionsParams {
    search?: string;
    type?: 'BANK' | 'MFI' | 'SACCO';
    limit?: number;
    offset?: number;
}

export interface InstitutionsResult {
    data: Institution[];
    error: string | null;
    count: number | null;
}

/**
 * List institutions with optional filtering
 */
export async function listInstitutions(params: ListInstitutionsParams = {}): Promise<InstitutionsResult> {
    const { search, type, limit = 50, offset = 0 } = params;

    try {
        let query = supabase
            .from('institutions')
            .select('*', { count: 'exact' })
            .order('name', { ascending: true })
            .range(offset, offset + limit - 1);

        if (search) {
            query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
        }

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching institutions:', error);
            return { data: [], error: error.message, count: null };
        }

        return {
            data: (data ?? []) as Institution[],
            error: null,
            count
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Exception in listInstitutions:', err);
        return { data: [], error: message, count: null };
    }
}

/**
 * Get a single institution by ID
 */
export async function getInstitution(id: string): Promise<{ data: Institution | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('institutions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching institution:', error);
            return { data: null, error: error.message };
        }

        return { data: data as Institution, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}

/**
 * Get institution with branch and member counts
 */
export async function getInstitutionWithCounts(id: string): Promise<{
    data: Institution & { branchCount: number; memberCount: number } | null;
    error: string | null;
}> {
    try {
        const [instResult, branchResult, memberResult] = await Promise.all([
            supabase.from('institutions').select('*').eq('id', id).single(),
            supabase.from('branches').select('id', { count: 'exact' }).eq('institution_id', id),
            supabase.from('members').select('id', { count: 'exact' }).eq('institution_id', id)
        ]);

        if (instResult.error) {
            return { data: null, error: instResult.error.message };
        }

        return {
            data: {
                ...(instResult.data as Institution),
                branchCount: branchResult.count ?? 0,
                memberCount: memberResult.count ?? 0
            },
            error: null
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}

/**
 * Create a new institution
 */
export async function createInstitution(data: Omit<Institution, 'id' | 'created_at'>): Promise<{
    data: Institution | null;
    error: string | null;
}> {
    try {
        const { data: created, error } = await supabase
            .from('institutions')
            .insert(data)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: created as Institution, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}

/**
 * Update an institution
 */
export async function updateInstitution(
    id: string,
    data: Partial<Omit<Institution, 'id' | 'created_at'>>
): Promise<{ data: Institution | null; error: string | null }> {
    try {
        const { data: updated, error } = await supabase
            .from('institutions')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { data: null, error: error.message };
        }

        return { data: updated as Institution, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { data: null, error: message };
    }
}
