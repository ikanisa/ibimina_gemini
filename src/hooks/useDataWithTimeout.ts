/**
 * useDataWithTimeout - Timeout-protected data fetching wrapper
 * 
 * Wraps async operations with configurable timeout and error recovery.
 * Designed to eliminate infinite loading states.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseDataWithTimeoutOptions<T> {
    /** Async function to fetch data */
    fetcher: () => Promise<T>;
    /** Timeout in milliseconds (default: 15000) */
    timeoutMs?: number;
    /** Auto-fetch on mount (default: true) */
    autoFetch?: boolean;
    /** Callback on successful fetch */
    onSuccess?: (data: T) => void;
    /** Callback on error */
    onError?: (error: Error) => void;
}

export interface UseDataWithTimeoutResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    isTimeout: boolean;
    fetch: () => Promise<void>;
    retry: () => Promise<void>;
    reset: () => void;
}

export function useDataWithTimeout<T>({
    fetcher,
    timeoutMs = 15000,
    autoFetch = true,
    onSuccess,
    onError,
}: UseDataWithTimeoutOptions<T>): UseDataWithTimeoutResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTimeout, setIsTimeout] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setIsTimeout(false);
        setLoading(false);
    }, []);

    const fetch = useCallback(async () => {
        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);
        setIsTimeout(false);

        // Set up timeout
        const timeoutId = window.setTimeout(() => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (isMountedRef.current) {
                setIsTimeout(true);
                setError('Request timed out. Please try again.');
                setLoading(false);
            }
        }, timeoutMs);

        try {
            const result = await fetcher();

            window.clearTimeout(timeoutId);

            if (isMountedRef.current) {
                setData(result);
                setLoading(false);
                onSuccess?.(result);
            }
        } catch (err) {
            window.clearTimeout(timeoutId);

            if (isMountedRef.current) {
                // Don't set error if aborted due to timeout (already handled)
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }

                const message = err instanceof Error ? err.message : 'An unexpected error occurred';
                setError(message);
                setLoading(false);
                onError?.(err instanceof Error ? err : new Error(message));
            }
        }
    }, [fetcher, timeoutMs, onSuccess, onError]);

    const retry = useCallback(async () => {
        await fetch();
    }, [fetch]);

    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetch) {
            fetch();
        }

        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data,
        loading,
        error,
        isTimeout,
        fetch,
        retry,
        reset,
    };
}

export default useDataWithTimeout;
