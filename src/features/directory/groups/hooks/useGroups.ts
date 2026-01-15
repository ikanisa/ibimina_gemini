/**
 * Custom hook for group data management with React Query
 * 
 * Provides a clean interface for components to interact with group data
 * Uses React Query for caching, background refetching, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as groupsApi from '../lib/api/groups.api';
import { queryKeys } from '../lib/query-client';
import type { SupabaseGroup } from '@/core/types';
import { useAuth } from '../contexts/AuthContext';
import { withTimeout, handleError, getUserFriendlyMessage } from '../lib/errors/ErrorHandler';

export interface UseGroupsOptions {
  includeMemberCounts?: boolean;
  autoFetch?: boolean;
  initialLimit?: number;
  loadMoreLimit?: number;
}

export interface UseGroupsReturn {
  groups: SupabaseGroup[];
  memberCounts: Record<string, number>;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createGroup: (params: groupsApi.CreateGroupParams) => Promise<SupabaseGroup>;
  updateGroup: (id: string, params: groupsApi.UpdateGroupParams) => Promise<SupabaseGroup>;
  deleteGroup: (id: string) => Promise<void>;
  searchGroups: (searchTerm: string) => Promise<SupabaseGroup[]>;
  // Additional React Query features
  isFetching: boolean;
  isRefetching: boolean;
}

const DEFAULT_INITIAL_LIMIT = 50;
const DEFAULT_LOAD_MORE_LIMIT = 25;

export function useGroups(options: UseGroupsOptions = {}): UseGroupsReturn {
  const { institutionId } = useAuth();
  const {
    includeMemberCounts = false,
    autoFetch = true,
    initialLimit = DEFAULT_INITIAL_LIMIT,
    loadMoreLimit = DEFAULT_LOAD_MORE_LIMIT
  } = options;
  const queryClient = useQueryClient();

  // Build query key
  const queryKey = queryKeys.groups.list({
    institutionId: institutionId || '',
    searchTerm: undefined, // Can be extended later
  });

  // Use infinite query for pagination
  const {
    data,
    isLoading,
    isFetching,
    isRefetching,
    error,
    fetchNextPage,
    hasNextPage,
    refetch: refetchQuery,
  } = useInfiniteQuery({
    queryKey: [...queryKey, 'infinite', includeMemberCounts],
    queryFn: async ({ pageParam = 0 }) => {
      if (!institutionId) {
        return { data: [], memberCounts: {}, nextPage: null };
      }

      const limit = pageParam === 0 ? initialLimit : loadMoreLimit;

      // Wrap with timeout
      if (includeMemberCounts) {
        const result = await withTimeout(
          groupsApi.fetchGroupsWithMemberCounts(
            institutionId,
            { limit, offset: pageParam }
          ),
          30000,
          'useGroups.fetchGroupsWithMemberCounts'
        );
        return {
          data: result.groups,
          memberCounts: result.memberCounts,
          nextPage: result.groups.length === limit ? pageParam + result.groups.length : null,
        };
      } else {
        const groups = await withTimeout(
          groupsApi.fetchGroups(institutionId, { limit, offset: pageParam }),
          30000,
          'useGroups.fetchGroups'
        );
        return {
          data: groups,
          memberCounts: {},
          nextPage: groups.length === limit ? pageParam + groups.length : null,
        };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: autoFetch && !!institutionId,
    initialPageParam: 0,
  });

  // Flatten pages into single array and merge member counts
  const groups = data?.pages.flatMap(page => page.data) || [];
  const memberCounts = data?.pages.reduce((acc, page) => ({ ...acc, ...page.memberCounts }), {}) || {};

  // Create group mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: (params: groupsApi.CreateGroupParams) =>
      groupsApi.createGroup(params),
    onSuccess: (newGroup) => {
      // Invalidate and refetch groups list
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });

      // Optionally update the cache optimistically
      queryClient.setQueryData<typeof data>(
        [...queryKey, 'infinite', includeMemberCounts],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page, idx) =>
              idx === 0
                ? { ...page, data: [newGroup, ...page.data] }
                : page
            ),
          };
        }
      );
    },
  });

  // Update group mutation with optimistic update
  const updateMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: groupsApi.UpdateGroupParams }) =>
      groupsApi.updateGroup(id, params),
    onMutate: async ({ id, params }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<typeof data>([...queryKey, 'infinite', includeMemberCounts]);

      // Optimistically update
      queryClient.setQueryData<typeof data>(
        [...queryKey, 'infinite', includeMemberCounts],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              data: page.data.map(g => g.id === id ? { ...g, ...params } as SupabaseGroup : g),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData([...queryKey, 'infinite', includeMemberCounts], context.previousData);
      }
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });

  // Delete group mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupsApi.deleteGroup(id),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });

  const createGroup = async (params: groupsApi.CreateGroupParams) => {
    return createMutation.mutateAsync(params);
  };

  const updateGroup = async (id: string, params: groupsApi.UpdateGroupParams) => {
    return updateMutation.mutateAsync({ id, params });
  };

  const deleteGroup = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const searchGroups = async (searchTerm: string) => {
    if (!institutionId) return [];
    try {
      return await groupsApi.searchGroups(institutionId, searchTerm);
    } catch (err) {
      console.error('Error searching groups:', err);
      return [];
    }
  };

  const loadMore = async () => {
    if (hasNextPage && !isFetching) {
      await fetchNextPage();
    }
  };

  const refetch = async () => {
    await refetchQuery();
  };

  // Handle errors consistently
  const errorMessage = error
    ? getUserFriendlyMessage(
      handleError(error, 'useGroups')
    )
    : null;

  return {
    groups,
    memberCounts,
    loading: isLoading,
    loadingMore: isFetching && !isLoading,
    error: errorMessage,
    hasMore: hasNextPage || false,
    refetch,
    loadMore,
    createGroup,
    updateGroup,
    deleteGroup,
    searchGroups,
    isFetching,
    isRefetching,
  };
}
