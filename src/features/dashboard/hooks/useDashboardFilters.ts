/**
 * useDashboardFilters Hook
 * 
 * Manages dashboard filter state with localStorage persistence.
 */

import { useState, useCallback, useEffect } from 'react';
import { TimeRange, getDateRangeFromFilter } from '../components/TimeRangeFilter';

const STORAGE_KEY = 'dashboard_time_filter';

export interface UseDashboardFiltersReturn {
    /** Currently selected time range */
    timeRange: TimeRange;
    /** Set the time range */
    setTimeRange: (range: TimeRange) => void;
    /** Get date range object from current filter */
    dateRange: { start: Date; end: Date };
    /** Get ISO date strings for API queries */
    dateRangeISO: { startISO: string; endISO: string };
}

/**
 * Hook for managing dashboard time range filters with persistence
 */
export function useDashboardFilters(): UseDashboardFiltersReturn {
    const [timeRange, setTimeRangeState] = useState<TimeRange>(() => {
        // Try to load from localStorage
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && ['today', 'week', 'month', 'year', 'all'].includes(stored)) {
                return stored as TimeRange;
            }
        }
        return 'month'; // Default to monthly view
    });

    // Persist to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, timeRange);
        }
    }, [timeRange]);

    const setTimeRange = useCallback((range: TimeRange) => {
        setTimeRangeState(range);
    }, []);

    const dateRange = getDateRangeFromFilter(timeRange);

    const dateRangeISO = {
        startISO: dateRange.start.toISOString(),
        endISO: dateRange.end.toISOString(),
    };

    return {
        timeRange,
        setTimeRange,
        dateRange,
        dateRangeISO,
    };
}

export default useDashboardFilters;
