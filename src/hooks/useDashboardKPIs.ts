/**
 * Custom hook for Dashboard KPI data
 * 
 * Centralizes dashboard data fetching with caching to optimize performance.
 * Replaces direct RPC calls in components.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isSuperAdmin } from '../lib/utils/roleHelpers';
import { withTimeout } from '../lib/utils/timeout';

// API response structure matching the RPC function
export interface DashboardData {
    institution_id: string | null;
    is_global: boolean;
    period_days: number;
    generated_at: string;
    kpis: {
        today: {
            received_total: number;
            allocated_count: number;
            unallocated_count: number;
            parse_errors_count: number;
        };
        last_days: {
            days: number;
            received_total: number;
            allocated_count: number;
            unallocated_count: number;
            unallocated_aging_24h: number;
            parse_errors_count: number;
        };
    };
    attention: Array<{
        type: string;
        title: string;
        count: number;
        severity: 'high' | 'medium' | 'low';
        action_path: string;
    }>;
    unallocated_preview: Array<{
        id: string;
        occurred_at: string;
        amount: number;
        payer_phone: string | null;
        momo_ref: string | null;
    }>;
    parse_error_preview: Array<{
        id: string;
        received_at: string;
        sender_phone: string;
        parse_error: string | null;
    }>;
    recent_activity: Array<{
        id: string;
        created_at: string;
        action: string;
        actor_user_id: string;
        actor_email: string | null;
        metadata: Record<string, unknown> | null;
    }>;
    health: {
        momo_primary_code_present: boolean;
        sms_sources_offline_count: number;
        last_sms_seen_at: string | null;
    };
}

export function useDashboardKPIs(selectedInstitutionId: string | null = null) {
    const { role, institutionId: userInstitutionId } = useAuth();
    const isPlatformAdmin = isSuperAdmin(role);

    // Determine effective institution ID based on role
    // If admin, use selected. If staff/allocator, force their assigned institution.
    const effectiveInstitutionId = isPlatformAdmin ? selectedInstitutionId : userInstitutionId;

    return useQuery({
        queryKey: ['dashboard', 'kpis', isPlatformAdmin ? 'global' : 'institution', effectiveInstitutionId],
        queryFn: async () => {
            const rpcQuery = supabase.rpc('get_dashboard_summary', {
                p_institution_id: effectiveInstitutionId || null,
                p_days: 7
            });

            const response = await withTimeout(
                Promise.resolve(rpcQuery),
                20000,
                'Dashboard load timeout'
            );

            const { data, error } = response;

            if (error) {
                throw error;
            }

            return data as DashboardData;
        },
        // Cache for 5 minutes (user requirement)
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for longer
        gcTime: 10 * 60 * 1000,
        retry: 1,
        enabled: isPlatformAdmin || !!effectiveInstitutionId,
    });
}
