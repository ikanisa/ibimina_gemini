import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/errors/ErrorHandler';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
    id: string;
    amount: number;
    occurred_at: string;
    member_id?: string;
    group_id?: string;
    allocation_status: 'unallocated' | 'allocated' | 'flagged';
    // Extended fields from Supabase
    institution_id?: string;
    type?: string;
    currency?: string;
    channel?: string;
    status?: string;
    reference?: string | null;
    momo_ref?: string | null;
    payer_phone?: string | null;
    payer_name?: string | null;
    members?: { full_name?: string };
    groups?: { name?: string };
}

export interface UseTransactionsPaginatedOptions {
    limit?: number;
    pageSize?: number; // alias for limit
    institutionId?: string;
    status?: string;
    autoFetch?: boolean;
    dateRange?: { start: string; end: string };
    searchTerm?: string;
}

export interface UseTransactionsPaginatedReturn {
    transactions: Transaction[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    refetch: () => Promise<void>;
    refresh: () => Promise<void>; // alias for refetch
}

export function useTransactionsPaginated(
    options: UseTransactionsPaginatedOptions = {}
): UseTransactionsPaginatedReturn {
    const {
        limit,
        pageSize,
        institutionId: optInstitutionId,
        status,
        autoFetch = true,
        dateRange,
        searchTerm
    } = options;

    const effectivePageSize = limit ?? pageSize ?? 50;
    const { institutionId: authInstitutionId } = useAuth();
    const effectiveInstitutionId = optInstitutionId ?? authInstitutionId;

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const isMounted = useRef(true);

    const fetchTransactions = useCallback(async (pageNum: number, append = false) => {
        try {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    members:member_id(full_name),
                    groups:group_id(name)
                `)
                .order('occurred_at', { ascending: false })
                .range(pageNum * effectivePageSize, (pageNum + 1) * effectivePageSize - 1);

            if (effectiveInstitutionId) {
                query = query.eq('institution_id', effectiveInstitutionId);
            }

            if (status) {
                query = query.eq('allocation_status', status);
            }

            // Apply date range filter
            if (dateRange?.start) {
                query = query.gte('occurred_at', `${dateRange.start}T00:00:00`);
            }
            if (dateRange?.end) {
                query = query.lte('occurred_at', `${dateRange.end}T23:59:59`);
            }

            // Apply search filter
            if (searchTerm && searchTerm.trim()) {
                const term = searchTerm.trim();
                query = query.or(`payer_phone.ilike.%${term}%,payer_name.ilike.%${term}%,momo_ref.ilike.%${term}%`);
            }

            const { data, error: fetchError } = await query;

            if (!isMounted.current) return;

            if (fetchError) {
                const appError = handleError(fetchError, 'useTransactionsPaginated');
                setError(appError.message);
                return;
            }

            if (data) {
                setTransactions(prev => append ? [...prev, ...data] : data);
                setHasMore(data.length === effectivePageSize);
            }
        } catch (err) {
            if (!isMounted.current) return;
            const appError = handleError(err, 'useTransactionsPaginated');
            setError(appError.message);
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setLoadingMore(false);
            }
        }
    }, [effectivePageSize, effectiveInstitutionId, status, dateRange?.start, dateRange?.end, searchTerm]);

    const loadMore = useCallback(async () => {
        if (!loading && !loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            await fetchTransactions(nextPage, true);
        }
    }, [loading, loadingMore, hasMore, page, fetchTransactions]);

    const refetch = useCallback(async () => {
        setPage(0);
        setHasMore(true);
        await fetchTransactions(0, false);
    }, [fetchTransactions]);

    // Auto-fetch on mount and when dependencies change
    useEffect(() => {
        isMounted.current = true;
        if (autoFetch) {
            setPage(0);
            fetchTransactions(0, false);
        }
        return () => {
            isMounted.current = false;
        };
    }, [fetchTransactions, autoFetch]);

    return {
        transactions,
        loading,
        loadingMore,
        error,
        hasMore,
        loadMore,
        refetch,
        refresh: refetch, // alias for backward compatibility
    };
}
