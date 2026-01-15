/**
 * Custom hook for member data management with React Query
 * 
 * Provides a clean interface for components to interact with member data
 * Uses React Query for caching, background refetching, and optimistic updates
 * 
 * @deprecated Consider using useMembersV2 from '@/features/directory/members' for new code
 */

import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { memberService, type CreateMemberInput, type UpdateMemberInput } from '@/features/directory/members/services/memberService';
import { queryKeys } from '../lib/query-client';
import type { SupabaseMember } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getUserFriendlyMessage } from '@/core/errors';

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
  createMember: (params: CreateMemberInput) => Promise<SupabaseMember>;
  updateMember: (id: string, params: UpdateMemberInput) => Promise<SupabaseMember>;
  deleteMember: (id: string) => Promise<void>;
  searchMembers: (searchTerm: string) => Promise<SupabaseMember[]>;
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
    searchTerm: undefined,
  });

  // Use infinite query for pagination - now using memberService
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

      // Use memberService.getAll
      const members = await memberService.getAll({
        institutionId,
        limit,
      });

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

  // Create member mutation - using memberService
  const createMutation = useMutation({
    mutationFn: (params: CreateMemberInput) => memberService.create(params),
    onSuccess: (newMember) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() });
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

  // Update member mutation - using memberService
  const updateMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateMemberInput }) =>
      memberService.update(id, params),
    onMutate: async ({ id, params }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<typeof data>([...queryKey, 'infinite']);
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
      if (context?.previousData) {
        queryClient.setQueryData([...queryKey, 'infinite'], context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() });
    },
  });

  // Delete member mutation - note: memberService doesn't have delete, so we'll mark as inactive
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await memberService.update(id, { status: 'INACTIVE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() });
    },
  });

  const createMember = async (params: CreateMemberInput) => {
    return createMutation.mutateAsync(params);
  };

  const updateMember = async (id: string, params: UpdateMemberInput) => {
    return updateMutation.mutateAsync({ id, params });
  };

  const deleteMember = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const searchMembers = async (searchTerm: string) => {
    if (!institutionId) return [];
    try {
      return await memberService.search(institutionId, searchTerm);
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

  const errorMessage = error ? getUserFriendlyMessage(error) : null;

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
