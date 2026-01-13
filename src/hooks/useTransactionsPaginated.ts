import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/errors/ErrorHandler';

interface Transaction {
    id: string;
    amount: number;
    occurred_at: string;
    member_id?: string;
    group_id?: string;
    allocation_status: 'unallocated' | 'allocated' | 'flagged';
    // ... other transaction fields
}

interface UseTransactionsPaginatedOptions {
    pageSize?: number;
    institutionId?: string;
    status?: string;
}

interface UseTransactionsPaginatedReturn {
    transactions: Transaction[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useTransactionsPaginated(
    options: UseTransactionsPaginatedOptions = {}
): UseTransactionsPaginatedReturn {
    const { pageSize = 50, institutionId, status } = options;

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);

    const fetchTransactions = useCallback(async (pageNum: number, append = false) => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('transactions')
                .select('*')
                .order('occurred_at', { ascending: false })
                .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

            if (institutionId) {
                query = query.eq('institution_id', institutionId);
            }

            if (status) {
                query = query.eq('allocation_status', status);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                const appError = handleError(fetchError, 'useTransactionsPaginated');
                setError(appError.message);
                return;
            }

            if (data) {
                setTransactions(prev => append ? [...prev, ...data] : data);
                setHasMore(data.length === pageSize);
            }
        } catch (err) {
            const appError = handleError(err, 'useTransactionsPaginated');
            setError(appError.message);
        } finally {
            setLoading(false);
        }
    }, [pageSize, institutionId, status]);

    const loadMore = useCallback(async () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            await fetchTransactions(nextPage, true);
        }
    }, [loading, hasMore, page, fetchTransactions]);

    const refresh = useCallback(async () => {
        setPage(0);
        await fetchTransactions(0, false);
    }, [fetchTransactions]);

    useEffect(() => {
        fetchTransactions(0);
    }, [fetchTransactions]);

    return {
        transactions,
        loading,
        error,
        hasMore,
        loadMore,
        refresh,
    };
}
