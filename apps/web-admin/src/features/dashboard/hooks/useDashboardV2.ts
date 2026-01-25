/**
 * Dashboard Hooks - Standardized React Query hooks
 * 
 * Uses dashboardService with consistent caching and error handling.
 */

import { useAuth } from '@/core/auth';
import {
    useServiceQuery,
    createQueryKeys,
    getQueryErrorMessage,
} from '@/core/query';
import { dashboardService } from '../services/dashboardService';
import { isSuperAdmin } from '@/lib/utils/roleHelpers';

// ============================================================================
// Query Keys
// ============================================================================

export const dashboardKeys = {
    all: ['dashboard'] as const,
    summary: (institutionId: string | null) => ['dashboard', 'summary', institutionId] as const,
    kpis: (institutionId: string | null) => ['dashboard', 'kpis', institutionId] as const,
    activity: (institutionId: string) => ['dashboard', 'activity', institutionId] as const,
    attention: (institutionId: string) => ['dashboard', 'attention', institutionId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch dashboard summary
 */
export function useDashboardSummary(selectedInstitutionId: string | null = null) {
    const { role, institutionId: userInstitutionId } = useAuth();
    const isPlatformAdmin = isSuperAdmin(role);

    const effectiveInstitutionId = isPlatformAdmin ? selectedInstitutionId : userInstitutionId;

    const query = useServiceQuery(
        dashboardKeys.summary(effectiveInstitutionId),
        () => dashboardService.getSummary(effectiveInstitutionId),
        {
            enabled: isPlatformAdmin || !!effectiveInstitutionId,
            cacheTime: 'MEDIUM',
        }
    );

    return {
        summary: query.data,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error ? getQueryErrorMessage(query.error) : null,
        refetch: query.refetch,
    };
}

/**
 * Fetch dashboard KPIs
 */
export function useDashboardKPIsV2(selectedInstitutionId: string | null = null) {
    const { role, institutionId: userInstitutionId } = useAuth();
    const isPlatformAdmin = isSuperAdmin(role);

    const effectiveInstitutionId = isPlatformAdmin ? selectedInstitutionId : userInstitutionId;

    const query = useServiceQuery(
        dashboardKeys.kpis(effectiveInstitutionId),
        () => dashboardService.getKPIs(effectiveInstitutionId),
        {
            enabled: isPlatformAdmin || !!effectiveInstitutionId,
            cacheTime: 'MEDIUM',
        }
    );

    return {
        kpis: query.data,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error ? getQueryErrorMessage(query.error) : null,
        refetch: query.refetch,
    };
}

/**
 * Fetch recent activity
 */
export function useRecentActivity(limit: number = 10) {
    const { institutionId } = useAuth();

    const query = useServiceQuery(
        dashboardKeys.activity(institutionId || ''),
        () => dashboardService.getRecentActivity(institutionId || '', limit),
        {
            enabled: !!institutionId,
            cacheTime: 'SHORT',
        }
    );

    return {
        activities: query.data || [],
        isLoading: query.isLoading,
        error: query.error ? getQueryErrorMessage(query.error) : null,
    };
}

/**
 * Fetch attention items (things needing action)
 */
export function useAttentionItems() {
    const { institutionId } = useAuth();

    const query = useServiceQuery(
        dashboardKeys.attention(institutionId || ''),
        () => dashboardService.getAttentionItems(institutionId || ''),
        {
            enabled: !!institutionId,
            cacheTime: 'SHORT',
        }
    );

    return {
        attentionItems: query.data,
        isLoading: query.isLoading,
        error: query.error ? getQueryErrorMessage(query.error) : null,
    };
}
