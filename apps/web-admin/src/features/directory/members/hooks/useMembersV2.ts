/**
 * Member Hooks - Standardized React Query hooks
 * 
 * Uses memberService with consistent caching and error handling.
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
    memberService,
    type MemberFilters,
    type CreateMemberInput,
    type UpdateMemberInput
} from '../services/memberService';

// ============================================================================
// Query Keys
// ============================================================================

export const memberKeys = createQueryKeys('members');

// ============================================================================
// Hooks
// ============================================================================

export interface UseMembersV2Options {
    groupId?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    searchTerm?: string;
    limit?: number;
    enabled?: boolean;
}

/**
 * Fetch members with filters
 */
export function useMembersV2(options: UseMembersV2Options = {}) {
    const { institutionId } = useAuth();
    const { enabled = true, ...filterOptions } = options;

    const filters: MemberFilters = {
        institutionId: institutionId || '',
        ...filterOptions,
    };

    const queryKey = memberKeys.list(filters);

    const query = useServiceQuery(
        queryKey,
        () => memberService.getAll(filters),
        {
            enabled: enabled && !!institutionId,
            cacheTime: 'MEDIUM',
            keepPreviousData: true,
        }
    );

    return {
        members: query.data || [],
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error ? getQueryErrorMessage(query.error) : null,
        refetch: query.refetch,
    };
}

/**
 * Fetch a single member by ID
 */
export function useMemberDetail(memberId: string | undefined) {
    const query = useServiceQuery(
        memberKeys.detail(memberId || ''),
        () => memberService.getById(memberId!),
        {
            enabled: !!memberId,
            cacheTime: 'MEDIUM',
        }
    );

    return {
        member: query.data,
        isLoading: query.isLoading,
        error: query.error ? getQueryErrorMessage(query.error) : null,
    };
}

/**
 * Search members by name, phone, or code
 */
export function useMemberSearchV2(searchQuery: string, limit: number = 10) {
    const { institutionId } = useAuth();

    const query = useServiceQuery(
        ['members', 'search', institutionId, searchQuery],
        () => memberService.search(institutionId || '', searchQuery, limit),
        {
            enabled: !!institutionId && searchQuery.length >= 2,
            cacheTime: 'SHORT',
        }
    );

    return {
        results: query.data || [],
        isLoading: query.isLoading,
        error: query.error ? getQueryErrorMessage(query.error) : null,
    };
}

/**
 * Fetch member balance
 */
export function useMemberBalance(memberId: string | undefined) {
    const query = useServiceQuery(
        ['members', 'balance', memberId],
        () => memberService.getBalance(memberId!),
        {
            enabled: !!memberId,
            cacheTime: 'MEDIUM',
        }
    );

    return {
        balance: query.data,
        isLoading: query.isLoading,
        error: query.error ? getQueryErrorMessage(query.error) : null,
    };
}

/**
 * Fetch member transaction history
 */
export function useMemberTransactions(memberId: string | undefined, limit: number = 50) {
    const query = useServiceQuery(
        ['members', 'transactions', memberId],
        () => memberService.getTransactions(memberId!, limit),
        {
            enabled: !!memberId,
            cacheTime: 'SHORT',
        }
    );

    return {
        transactions: query.data || [],
        isLoading: query.isLoading,
        error: query.error ? getQueryErrorMessage(query.error) : null,
    };
}

/**
 * Create a new member
 */
export function useCreateMember() {
    const { institutionId } = useAuth();

    return useServiceMutation(
        (params: Omit<CreateMemberInput, 'institutionId'>) =>
            memberService.create({ ...params, institutionId: institutionId || '' }),
        {
            invalidateKeys: [memberKeys.lists()],
        }
    );
}

/**
 * Update a member
 */
export function useUpdateMember() {
    const queryClient = useQueryClient();

    return useServiceMutation(
        ({ memberId, updates }: { memberId: string; updates: UpdateMemberInput }) =>
            memberService.update(memberId, updates),
        {
            invalidateKeys: [memberKeys.lists()],
            onSuccess: (data) => {
                queryClient.setQueryData(memberKeys.detail(data.id), data);
            },
        }
    );
}
