/**
 * Custom hook for group data management with React Query
 * 
 * Provides a clean interface for components to interact with group data
 * Uses React Query for caching, background refetching, and optimistic updates
 * 
 * @deprecated Consider using useGroupsV2 from '@/features/directory/groups' for new code
 */

import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { groupService, type CreateGroupInput, type UpdateGroupInput } from '@/features/directory/groups/services/groupService';
import { queryKeys } from '../lib/query-client';
import type { SupabaseGroup } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getUserFriendlyMessage } from '@/core/errors';

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
  createGroup: (params: CreateGroupInput) => Promise<SupabaseGroup>;
  updateGroup: (id: string, params: UpdateGroupInput) => Promise<SupabaseGroup>;
  deleteGroup: (id: string) => Promise<void>;
  searchGroups: (searchTerm: string) => Promise<SupabaseGroup[]>;
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
    searchTerm: undefined,
  });

  // Use infinite query for pagination - now using groupService
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

      // Use groupService.getAll
      const groups = await groupService.getAll({
        institutionId,
        limit,
        // offset: pageParam, // Note: service would need to support offset for true pagination
      });

      // Build member counts if requested
      let memberCounts: Record<string, number> = {};
      if (includeMemberCounts) {
        // Get stats for each group to include member counts
        const statsPromises = groups.slice(0, 20).map(async (group) => {
          try {
            const stats = await groupService.getStats(group.id);
            return { id: group.id, count: stats.memberCount };
          } catch {
            return { id: group.id, count: 0 };
          }
        });
        const statsResults = await Promise.all(statsPromises);
        memberCounts = statsResults.reduce((acc, { id, count }) => {
          acc[id] = count;
          return acc;
        }, {} as Record<string, number>);
      }

      return {
        data: groups,
        memberCounts,
        nextPage: groups.length === limit ? pageParam + groups.length : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: autoFetch && !!institutionId,
    initialPageParam: 0,
  });

  // Flatten pages into single array and merge member counts
  const groups = data?.pages.flatMap(page => page.data) || [];
  const memberCounts = data?.pages.reduce((acc, page) => ({ ...acc, ...page.memberCounts }), {}) || {};

  // Create group mutation - using groupService
  const createMutation = useMutation({
    mutationFn: (params: CreateGroupInput) => groupService.create(params),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });
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

  // Update group mutation - using groupService
  const updateMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateGroupInput }) =>
      groupService.update(id, params),
    onMutate: async ({ id, params }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<typeof data>([...queryKey, 'infinite', includeMemberCounts]);
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
      if (context?.previousData) {
        queryClient.setQueryData([...queryKey, 'infinite', includeMemberCounts], context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });

  // Delete group mutation - using groupService
  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });

  const createGroup = async (params: CreateGroupInput) => {
    return createMutation.mutateAsync(params);
  };

  const updateGroup = async (id: string, params: UpdateGroupInput) => {
    return updateMutation.mutateAsync({ id, params });
  };

  const deleteGroup = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const searchGroups = async (searchTerm: string) => {
    if (!institutionId) return [];
    try {
      const allGroups = await groupService.getAll({ institutionId, searchTerm });
      return allGroups;
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

  const errorMessage = error ? getUserFriendlyMessage(error) : null;

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
