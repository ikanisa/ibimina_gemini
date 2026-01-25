/**
 * TimeRangeFilter Component
 * 
 * Pill-style filter group for selecting dashboard time ranges.
 * Supports Today, This Week, This Month, This Year, and All Time.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

export interface TimeRangeOption {
    value: TimeRange;
    label: string;
    shortLabel: string;
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
    { value: 'today', label: 'Today', shortLabel: 'Day' },
    { value: 'week', label: 'This Week', shortLabel: 'Week' },
    { value: 'month', label: 'This Month', shortLabel: 'Month' },
    { value: 'year', label: 'This Year', shortLabel: 'Year' },
    { value: 'all', label: 'All Time', shortLabel: 'All' },
];

export interface TimeRangeFilterProps {
    /** Currently selected range */
    value: TimeRange;
    /** Change handler */
    onChange: (range: TimeRange) => void;
    /** Show compact labels on mobile */
    compact?: boolean;
    /** Additional class names */
    className?: string;
}

export const TimeRangeFilter = memo<TimeRangeFilterProps>(({
    value,
    onChange,
    compact = false,
    className,
}) => {
    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 p-1 rounded-xl',
                'bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-sm',
                className
            )}
            role="radiogroup"
            aria-label="Time range filter"
        >
            {TIME_RANGE_OPTIONS.map((option) => {
                const isActive = value === option.value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'relative px-3 py-1.5 text-sm font-medium rounded-lg',
                            'transition-colors duration-200 outline-none',
                            'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                            isActive
                                ? 'text-blue-700'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                        )}
                    >
                        {/* Animated background for active state */}
                        {isActive && (
                            <motion.div
                                layoutId="time-range-active-bg"
                                className="absolute inset-0 bg-blue-100 rounded-lg"
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 30
                                }}
                            />
                        )}

                        {/* Label */}
                        <span className="relative z-10">
                            {compact ? option.shortLabel : option.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
});

TimeRangeFilter.displayName = 'TimeRangeFilter';

/**
 * Calculate date range from TimeRange value
 */
export function getDateRangeFromFilter(range: TimeRange): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    let start: Date;

    switch (range) {
        case 'today':
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            break;
        case 'week':
            start = new Date(now);
            start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
            start.setHours(0, 0, 0, 0);
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            break;
        case 'all':
        default:
            start = new Date(0); // Epoch
            break;
    }

    return { start, end };
}

export default TimeRangeFilter;
