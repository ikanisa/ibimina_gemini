import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth';
import { useQuery } from '@tanstack/react-query';

export interface MemberSearchResult {
    id: string;
    full_name: string;
    phone: string;
    member_code: string | null;
    group_id: string;
    groups?: {
        name: string;
    };
}

export function useMemberSearch(searchTerm: string, debounceMs = 300) {
    const { institutionId } = useAuth();
    const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, debounceMs);

        return () => clearTimeout(handler);
    }, [searchTerm, debounceMs]);

    return useQuery({
        queryKey: ['memberSearch', institutionId, debouncedTerm],
        queryFn: async () => {
            if (!institutionId || !debouncedTerm || debouncedTerm.length < 2) return [];

            const { data, error } = await supabase
                .from('members')
                .select('id, full_name, phone, member_code, group_id, groups(name)')
                .eq('institution_id', institutionId)
                .or(`full_name.ilike.%${debouncedTerm}%,phone.ilike.%${debouncedTerm}%`)
                .limit(10);

            if (error) throw error;
            return data as MemberSearchResult[];
        },
        enabled: !!institutionId && debouncedTerm.length >= 2,
        staleTime: 60000 // Cache results for 1 minute
    });
}
