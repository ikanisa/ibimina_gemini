import { useState, useEffect, useCallback, useRef } from 'react';
import { withTimeout, handleError, getUserFriendlyMessage } from '@/lib/errors/ErrorHandler';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (offset: number, limit: number) => Promise<T[]>;
  initialLimit?: number;
  loadMoreLimit?: number;
  threshold?: number; // pixels from bottom to trigger load
  timeout?: number; // timeout in milliseconds (default: 30s)
}

interface UseInfiniteScrollReturn<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function useInfiniteScroll<T>({
  fetchFn,
  initialLimit = 50,
  loadMoreLimit = 25,
  threshold = 200,
  timeout = 30000,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const fetchFnRef = useRef(fetchFn);
  const initialLimitRef = useRef(initialLimit);
  const timeoutRef = useRef(timeout);

  // Keep refs updated
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    initialLimitRef.current = initialLimit;
    timeoutRef.current = timeout;
  }, [fetchFn, initialLimit, timeout]);

  // Initial load with timeout and error handling
  const loadInitial = useCallback(async () => {
    if (loadingRef.current) return; // Prevent duplicate loads

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await withTimeout(
        fetchFnRef.current(0, initialLimitRef.current),
        timeoutRef.current,
        { operation: 'infiniteScroll.initialLoad', component: 'useInfiniteScroll' }
      );
      setItems(data);
      setOffset(data.length);
      setHasMore(data.length === initialLimitRef.current);
    } catch (err) {
      const appError = handleError(err, 'useInfiniteScroll.initialLoad');
      setError(getUserFriendlyMessage(appError));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []); // No dependencies - using refs instead

  // Load more with timeout and error handling
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoadingMore(true);

    try {
      const currentOffset = offset;
      const data = await withTimeout(
        fetchFnRef.current(currentOffset, loadMoreLimit),
        timeoutRef.current,
        { operation: 'infiniteScroll.loadMore', component: 'useInfiniteScroll' }
      );
      setItems(prev => [...prev, ...data]);
      setOffset(prev => prev + data.length);
      setHasMore(data.length === loadMoreLimit);
    } catch (err) {
      const appError = handleError(err, 'useInfiniteScroll.loadMore');
      setError(getUserFriendlyMessage(appError));
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [offset, loadMoreLimit, hasMore]); // fetchFn removed - using ref

  // Refresh (reset and reload)
  const refresh = useCallback(() => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    loadInitial();
  }, [loadInitial]);

  // Initial load on mount - only run once
  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (loadingRef.current || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadMore, threshold]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    containerRef,
  };
}

export default useInfiniteScroll;


