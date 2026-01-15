/**
 * Group Hooks - Standardized React Query hooks
 * 
 * Uses groupService with consistent caching and error handling.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth';
import {
    useServiceQuery,
    useServiceMutation,
    createQueryKeys,
    getQueryErrorMessage,
} from '@/core/query';
import {
    groupService,
    type GroupFilters,
    type CreateGroupInput,
    type UpdateGroupInput
} from './services/groupService';

// ============================================================================
// Query Keys
// ============================================================================

export const groupKeys = createQueryKeys('groups');

// ============================================================================
// Hooks
// ============================================================================

export interface UseGroupsV2Options {
    status?: 'ACTIVE' | 'PAUSED' | 'CLOSED';
    searchTerm?: string;
    limit?: number;
    enabled?: boolean;
}

/**
 * Fetch groups with filters
 */
export function useGroupsV2(options: UseGroupsV2Options = {}) {
    const { institutionId } = useAuth();
    const { enabled = true, ...filterOptions } = options;

    const filters: GroupFilters = {
        institutionId: institutionId || '',
        ...filterOptions,
    };

    const queryKey = groupKeys.list(filters);

    const query = useServiceQuery(
        queryKey,
        () => groupService.getAll(filters),
        {
            enabled: enabled && !!institutionId,
            cacheTime: 'MEDIUM',
            keepPreviousData: true,
        }
    );

    return {
        groups: query.data || [],
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error ? getQueryErrorMessage(query.error) : null,
        refetch: query.refetch,
    };
}

/**
 * Fetch a single group by ID
 */
export function useGroupDetail(groupId: string | undefined) {
    const query = useServiceQuery(
        groupKeys.detail(groupId || ''),
        () => groupService.getById(groupId!),
        {
            enabled: !!groupId,
            cacheTime: 'MEDIUM',
        }
    );

    return {
        group: query.data,
        isLoading: query.isLoading,
        error: query.error ? getQueryErrorMessage(query.error) : null,
    };
}

/**
 * Fetch group statistics
 */
export function useGroupStats(groupId: string | undefined) {
    const query = useServiceQuery(
        ['groups', 'stats', groupId],
        () => groupService.getStats(groupId!),
        {
            enabled: !!groupId,
            cacheTime: 'MEDIUM',
        }
    );

    return {
        stats: query.data,
        isLoading: query.isLoading,
        error: query.error ? getQueryErrorMessage(query.error) : null,
    };
}

/**
 * Create a new group
 */
export function useCreateGroup() {
    const { institutionId } = useAuth();

    return useServiceMutation(
        (params: Omit<CreateGroupInput, 'institutionId'>) =>
            groupService.create({ ...params, institutionId: institutionId || '' }),
        {
            invalidateKeys: [groupKeys.lists()],
        }
    );
}

/**
 * Update a group
 */
export function useUpdateGroup() {
    const queryClient = useQueryClient();

    return useServiceMutation(
        ({ groupId, updates }: { groupId: string; updates: UpdateGroupInput }) =>
            groupService.update(groupId, updates),
        {
            invalidateKeys: [groupKeys.lists()],
            onSuccess: (data) => {
                queryClient.setQueryData(groupKeys.detail(data.id), data);
            },
        }
    );
}

/**
 * Delete (archive) a group
 */
export function useDeleteGroup() {
    return useServiceMutation(
        (groupId: string) => groupService.delete(groupId),
        {
            invalidateKeys: [groupKeys.lists()],
        }
    );
}
