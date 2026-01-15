/**
 * React Query Utilities
 * 
 * Standardized patterns for React Query hooks across the application.
 * Use these utilities for consistent caching, error handling, and optimistic updates.
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type UseMutationOptions,
    type QueryKey,
} from '@tanstack/react-query';
import {
    AppError,
    createAppError,
    getUserFriendlyMessage,
    isRetryableError,
} from '@/core/errors';

// ============================================================================
// Standard Cache Times
// ============================================================================

export const CACHE_TIMES = {
    /** Fresh for 30 seconds - for rapidly changing data */
    SHORT: { staleTime: 30 * 1000, gcTime: 60 * 1000 },

    /** Fresh for 5 minutes - default for most data */
    MEDIUM: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },

    /** Fresh for 30 minutes - for rarely changing data */
    LONG: { staleTime: 30 * 60 * 1000, gcTime: 60 * 60 * 1000 },

    /** Fresh for 1 hour - for static reference data */
    STATIC: { staleTime: 60 * 60 * 1000, gcTime: 24 * 60 * 60 * 1000 },
} as const;

// ============================================================================
// Query Key Factory
// ============================================================================

/**
 * Create a query key factory for a feature domain
 */
export function createQueryKeys<T extends string>(domain: T) {
    return {
        all: [domain] as const,
        lists: () => [domain, 'list'] as const,
        list: (filters: Record<string, unknown>) => [domain, 'list', filters] as const,
        details: () => [domain, 'detail'] as const,
        detail: (id: string) => [domain, 'detail', id] as const,
    };
}

// ============================================================================
// Standardized Query Hook
// ============================================================================

export interface UseServiceQueryOptions<TData> {
    /** Whether query is enabled */
    enabled?: boolean;
    /** Cache timing preset */
    cacheTime?: keyof typeof CACHE_TIMES;
    /** Keep previous data while loading new */
    keepPreviousData?: boolean;
    /** Transform data after fetch */
    select?: (data: TData) => TData;
    /** Called on success */
    onSuccess?: (data: TData) => void;
    /** Called on error */
    onError?: (error: AppError) => void;
}

/**
 * Create a standardized query hook for service calls
 */
export function useServiceQuery<TData>(
    queryKey: QueryKey,
    queryFn: () => Promise<TData>,
    options: UseServiceQueryOptions<TData> = {}
) {
    const {
        enabled = true,
        cacheTime = 'MEDIUM',
        keepPreviousData = true,
        select,
        onSuccess,
        onError,
    } = options;

    const cacheConfig = CACHE_TIMES[cacheTime];

    return useQuery({
        queryKey,
        queryFn: async () => {
            try {
                return await queryFn();
            } catch (error) {
                // Ensure all errors are AppErrors
                const appError = error instanceof AppError ? error : createAppError(error);
                throw appError;
            }
        },
        enabled,
        staleTime: cacheConfig.staleTime,
        gcTime: cacheConfig.gcTime,
        placeholderData: keepPreviousData ? (prev: TData | undefined) => prev : undefined,
        select,
        retry: (failureCount, error) => {
            if (failureCount >= 3) return false;
            return isRetryableError(error);
        },
    });
}

// ============================================================================
// Standardized Mutation Hook
// ============================================================================

export interface UseServiceMutationOptions<TData, TVariables, TContext = unknown> {
    /** Called before mutation - return context for rollback */
    onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
    /** Called on success */
    onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
    /** Called on error - use context for rollback */
    onError?: (error: AppError, variables: TVariables, context: TContext | undefined) => void;
    /** Called after mutation completes (success or error) */
    onSettled?: (data: TData | undefined, error: AppError | null, variables: TVariables) => void;
    /** Query keys to invalidate on success */
    invalidateKeys?: QueryKey[];
}

/**
 * Create a standardized mutation hook for service calls
 */
export function useServiceMutation<TData, TVariables, TContext = unknown>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options: UseServiceMutationOptions<TData, TVariables, TContext> = {}
) {
    const queryClient = useQueryClient();
    const { invalidateKeys = [], onMutate, onSuccess, onError, onSettled } = options;

    return useMutation({
        mutationFn: async (variables: TVariables) => {
            try {
                return await mutationFn(variables);
            } catch (error) {
                const appError = error instanceof AppError ? error : createAppError(error);
                throw appError;
            }
        },
        onMutate,
        onSuccess: (data, variables, context) => {
            // Invalidate related queries
            invalidateKeys.forEach((key) => {
                queryClient.invalidateQueries({ queryKey: key });
            });
            onSuccess?.(data, variables, context);
        },
        onError: (error, variables, context) => {
            const appError = error instanceof AppError ? error : createAppError(error);
            onError?.(appError, variables, context);
        },
        onSettled: (data, error, variables) => {
            const appError = error ? (error instanceof AppError ? error : createAppError(error)) : null;
            onSettled?.(data, appError, variables);
        },
    });
}

// ============================================================================
// Optimistic Update Helpers
// ============================================================================

/**
 * Helper for optimistic updates in lists
 */
export function optimisticListAdd<T extends { id: string }>(
    queryClient: ReturnType<typeof useQueryClient>,
    queryKey: QueryKey,
    newItem: T
) {
    const previousData = queryClient.getQueryData<T[]>(queryKey);

    queryClient.setQueryData<T[]>(queryKey, (old = []) => [newItem, ...old]);

    return { previousData };
}

/**
 * Helper for optimistic updates to single items in a list
 */
export function optimisticListUpdate<T extends { id: string }>(
    queryClient: ReturnType<typeof useQueryClient>,
    queryKey: QueryKey,
    itemId: string,
    updates: Partial<T>
) {
    const previousData = queryClient.getQueryData<T[]>(queryKey);

    queryClient.setQueryData<T[]>(queryKey, (old = []) =>
        old.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );

    return { previousData };
}

/**
 * Helper for optimistic removal from lists
 */
export function optimisticListRemove<T extends { id: string }>(
    queryClient: ReturnType<typeof useQueryClient>,
    queryKey: QueryKey,
    itemId: string
) {
    const previousData = queryClient.getQueryData<T[]>(queryKey);

    queryClient.setQueryData<T[]>(queryKey, (old = []) =>
        old.filter((item) => item.id !== itemId)
    );

    return { previousData };
}

/**
 * Rollback helper for optimistic updates
 */
export function rollbackOptimisticUpdate<T>(
    queryClient: ReturnType<typeof useQueryClient>,
    queryKey: QueryKey,
    previousData: T | undefined
) {
    if (previousData !== undefined) {
        queryClient.setQueryData(queryKey, previousData);
    }
}

// ============================================================================
// Error Message Helper
// ============================================================================

/**
 * Get user-friendly error message from query/mutation error
 */
export function getQueryErrorMessage(error: unknown): string {
    return getUserFriendlyMessage(error);
}
