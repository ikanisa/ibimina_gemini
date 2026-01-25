/**
 * Custom hook for member data management with React Query
 * 
 * Provides a clean interface for components to interact with member data
 * Uses React Query for caching, background refetching, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as membersApi from '@/lib/api/members.api';
import { queryKeys } from '@/lib/query-client';
import type { SupabaseMember } from '@/core/types';
import { useAuth } from '@/core/auth';
import { withTimeout, handleError, getUserFriendlyMessage } from '@/lib/errors/ErrorHandler';

export interface UseMembersOptions {
  includeGroups?: boolean;
  autoFetch?: boolean;
  initialLimit?: number;
  loadMoreLimit?: number;
}

export interface UseMembersReturn {
  members: SupabaseMember[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createMember: (params: membersApi.CreateMemberParams) => Promise<SupabaseMember>;
  updateMember: (id: string, params: membersApi.UpdateMemberParams) => Promise<SupabaseMember>;
  deleteMember: (id: string) => Promise<void>;
  searchMembers: (searchTerm: string) => Promise<SupabaseMember[]>;
  // Additional React Query features
  isFetching: boolean;
  isRefetching: boolean;
}

const DEFAULT_INITIAL_LIMIT = 50;
const DEFAULT_LOAD_MORE_LIMIT = 25;

export function useMembers(options: UseMembersOptions = {}): UseMembersReturn {
  const { institutionId } = useAuth();
  const {
    includeGroups = false,
    autoFetch = true,
    initialLimit = DEFAULT_INITIAL_LIMIT,
    loadMoreLimit = DEFAULT_LOAD_MORE_LIMIT
  } = options;
  const queryClient = useQueryClient();

  // Build query key
  const queryKey = queryKeys.members.list({
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
    queryKey: [...queryKey, 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      if (!institutionId) {
        return { data: [], nextPage: null };
      }

      const limit = pageParam === 0 ? initialLimit : loadMoreLimit;

      // Wrap with timeout
      const data = includeGroups
        ? await withTimeout(
          membersApi.fetchMembersWithGroups(institutionId, { limit, offset: pageParam }),
          30000,
          {
            operation: 'fetchMembersWithGroups',
            component: 'useMembers',
            institutionId,
          }
        )
        : await withTimeout(
          membersApi.fetchMembers(institutionId, { limit, offset: pageParam }),
          30000,
          {
            operation: 'fetchMembers',
            component: 'useMembers',
            institutionId,
          }
        );

      // fetchMembersWithGroups returns MemberWithGroups[], fetchMembers returns SupabaseMember[]
      const members = data as SupabaseMember[];

      return {
        data: members,
        nextPage: members.length === limit ? pageParam + members.length : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: autoFetch && !!institutionId,
    initialPageParam: 0,
  });

  // Flatten pages into single array
  const members = data?.pages.flatMap(page => page.data) || [];

  // Create member mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: (params: membersApi.CreateMemberParams) =>
      membersApi.createMember(params),
    onSuccess: (newMember) => {
      // Invalidate and refetch members list
      queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() });

      // Optionally update the cache optimistically
      queryClient.setQueryData<typeof data>(
        [...queryKey, 'infinite'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page, idx) =>
              idx === 0
                ? { ...page, data: [newMember, ...page.data] }
                : page
            ),
          };
        }
      );
    },
  });

  // Update member mutation with optimistic update
  const updateMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: membersApi.UpdateMemberParams }) =>
      membersApi.updateMember(id, params),
    onMutate: async ({ id, params }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<typeof data>([...queryKey, 'infinite']);

      // Optimistically update
      queryClient.setQueryData<typeof data>(
        [...queryKey, 'infinite'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              data: page.data.map(m => m.id === id ? { ...m, ...params } as SupabaseMember : m),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData([...queryKey, 'infinite'], context.previousData);
      }
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() });
    },
  });

  // Delete member mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.deleteMember(id),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() });
    },
  });

  const createMember = async (params: membersApi.CreateMemberParams) => {
    return createMutation.mutateAsync(params);
  };

  const updateMember = async (id: string, params: membersApi.UpdateMemberParams) => {
    return updateMutation.mutateAsync({ id, params });
  };

  const deleteMember = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const searchMembers = async (searchTerm: string) => {
    if (!institutionId) return [];
    try {
      return await membersApi.searchMembers(institutionId, searchTerm);
    } catch (err) {
      console.error('Error searching members:', err);
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
    ? getUserFriendlyMessage(handleError(error, 'useMembers'))
    : null;


  return {
    members,
    loading: isLoading,
    loadingMore: isFetching && !isLoading,
    error: errorMessage,
    hasMore: hasNextPage || false,
    refetch,
    loadMore,
    createMember,
    updateMember,
    deleteMember,
    searchMembers,
    isFetching,
    isRefetching,
  };
}
