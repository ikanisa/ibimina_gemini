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

export const DEFAULT_DASHBOARD_DATA: DashboardData = {
    institution_id: null,
    is_global: false,
    period_days: 7,
    generated_at: new Date().toISOString(),
    kpis: {
        today: {
            received_total: 0,
            allocated_count: 0,
            unallocated_count: 0,
            parse_errors_count: 0,
        },
        last_days: {
            days: 7,
            received_total: 0,
            allocated_count: 0,
            unallocated_count: 0,
            unallocated_aging_24h: 0,
            parse_errors_count: 0,
        },
    },
    attention: [],
    unallocated_preview: [],
    parse_error_preview: [],
    recent_activity: [],
    health: {
        momo_primary_code_present: false,
        sms_sources_offline_count: 0,
        last_sms_seen_at: null,
    },
};

/**
 * Deep merge dashboard data with defaults to ensure all fields exist
 */
function mergeDashboardData(data: Partial<DashboardData> | null): DashboardData {
    if (!data) return DEFAULT_DASHBOARD_DATA;

    return {
        institution_id: data.institution_id ?? DEFAULT_DASHBOARD_DATA.institution_id,
        is_global: data.is_global ?? DEFAULT_DASHBOARD_DATA.is_global,
        period_days: data.period_days ?? DEFAULT_DASHBOARD_DATA.period_days,
        generated_at: data.generated_at ?? DEFAULT_DASHBOARD_DATA.generated_at,
        kpis: {
            today: {
                received_total: data.kpis?.today?.received_total ?? 0,
                allocated_count: data.kpis?.today?.allocated_count ?? 0,
                unallocated_count: data.kpis?.today?.unallocated_count ?? 0,
                parse_errors_count: data.kpis?.today?.parse_errors_count ?? 0,
            },
            last_days: {
                days: data.kpis?.last_days?.days ?? 7,
                received_total: data.kpis?.last_days?.received_total ?? 0,
                allocated_count: data.kpis?.last_days?.allocated_count ?? 0,
                unallocated_count: data.kpis?.last_days?.unallocated_count ?? 0,
                unallocated_aging_24h: data.kpis?.last_days?.unallocated_aging_24h ?? 0,
                parse_errors_count: data.kpis?.last_days?.parse_errors_count ?? 0,
            },
        },
        attention: data.attention ?? [],
        unallocated_preview: data.unallocated_preview ?? [],
        parse_error_preview: data.parse_error_preview ?? [],
        recent_activity: data.recent_activity ?? [],
        health: {
            momo_primary_code_present: data.health?.momo_primary_code_present ?? false,
            sms_sources_offline_count: data.health?.sms_sources_offline_count ?? 0,
            last_sms_seen_at: data.health?.last_sms_seen_at ?? null,
        },
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
        queryFn: async (): Promise<DashboardData> => {
            try {
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
                    console.error('[Dashboard] RPC Error:', error.message, error.code);
                    // Return default data instead of throwing - prevents error boundary trigger
                    return DEFAULT_DASHBOARD_DATA;
                }

                if (!data) {
                    console.warn('[Dashboard] RPC returned no data, using defaults');
                    return DEFAULT_DASHBOARD_DATA;
                }

                // Deep merge with defaults to ensure all fields exist
                return mergeDashboardData(data as Partial<DashboardData>);
            } catch (err) {
                console.error('[Dashboard] Unexpected error:', err);
                // Return default data instead of throwing
                return DEFAULT_DASHBOARD_DATA;
            }
        },
        // Cache for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for longer
        gcTime: 10 * 60 * 1000,
        // Retry with exponential backoff
        retry: 2,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
        // Only run if we have an institution ID or are a platform admin (viewing global)
        enabled: isPlatformAdmin || !!effectiveInstitutionId,
        // Return default data as placeholder while loading
        placeholderData: DEFAULT_DASHBOARD_DATA,
    });
}

