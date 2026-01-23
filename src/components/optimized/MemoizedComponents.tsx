/**
 * Memoized Component Wrappers
 * Performance-optimized versions of frequently re-rendered components
 */

import React, { memo, useMemo, useCallback } from 'react';

// ============================================================================
// MEMOIZED STAT CARD
// Used on dashboards - prevents re-render when parent updates
// ============================================================================

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
}

export const MemoizedStatCard = memo<StatCardProps>(
    ({ title, value, change, icon, trend = 'neutral', className = '' }) => {
        const trendColors = {
            up: 'text-green-600',
            down: 'text-red-600',
            neutral: 'text-slate-500',
        };

        return (
            <div className={`bg-white rounded-lg border border-slate-200 p-6 ${className}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">{title}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
                        {change !== undefined && (
                            <p className={`text-sm mt-1 ${trendColors[trend]}`}>
                                {change > 0 ? '+' : ''}{change}%
                            </p>
                        )}
                    </div>
                    {icon && (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                </div>
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison - only re-render if these change
        return (
            prevProps.value === nextProps.value &&
            prevProps.change === nextProps.change &&
            prevProps.title === nextProps.title
        );
    }
);
MemoizedStatCard.displayName = 'MemoizedStatCard';

// ============================================================================
// MEMOIZED LIST ITEM
// For transaction/member list rows
// ============================================================================

interface ListItemProps {
    id: string;
    primary: string;
    secondary?: string;
    trailing?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const MemoizedListItem = memo<ListItemProps>(
    ({ id, primary, secondary, trailing, onClick, className = '' }) => {
        return (
            <div
                className={`flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer ${className}`}
                onClick={onClick}
                data-id={id}
            >
                <div>
                    <p className="font-medium text-slate-900">{primary}</p>
                    {secondary && <p className="text-sm text-slate-500 mt-0.5">{secondary}</p>}
                </div>
                {trailing}
            </div>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.id === nextProps.id &&
            prevProps.primary === nextProps.primary &&
            prevProps.secondary === nextProps.secondary
        );
    }
);
MemoizedListItem.displayName = 'MemoizedListItem';

// ============================================================================
// MEMOIZED TABLE ROW
// For data tables
// ============================================================================

interface TableRowProps {
    cells: React.ReactNode[];
    onClick?: () => void;
    selected?: boolean;
    className?: string;
}

export const MemoizedTableRow = memo<TableRowProps>(
    ({ cells, onClick, selected, className = '' }) => {
        return (
            <tr
                className={`
          border-b border-slate-100 hover:bg-slate-50
          ${selected ? 'bg-blue-50' : 'bg-white'}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
                onClick={onClick}
            >
                {cells.map((cell, index) => (
                    <td key={index} className="px-4 py-3 text-sm text-slate-700">
                        {cell}
                    </td>
                ))}
            </tr>
        );
    }
);
MemoizedTableRow.displayName = 'MemoizedTableRow';

// ============================================================================
// MEMOIZED BADGE
// Status badges that rarely change
// ============================================================================

interface BadgeProps {
    label: string;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    size?: 'sm' | 'md';
}

export const MemoizedBadge = memo<BadgeProps>(
    ({ label, variant = 'neutral', size = 'md' }) => {
        const variants = {
            success: 'bg-green-100 text-green-800',
            warning: 'bg-amber-100 text-amber-800',
            error: 'bg-red-100 text-red-800',
            info: 'bg-blue-100 text-blue-800',
            neutral: 'bg-slate-100 text-slate-700',
        };

        const sizes = {
            sm: 'px-1.5 py-0.5 text-xs',
            md: 'px-2 py-1 text-xs',
        };

        return (
            <span className={`inline-flex rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
                {label}
            </span>
        );
    }
);
MemoizedBadge.displayName = 'MemoizedBadge';

// ============================================================================
// MEMOIZED AVATAR
// User avatars
// ============================================================================

interface AvatarProps {
    src?: string | null;
    name: string;
    size?: 'sm' | 'md' | 'lg';
}

export const MemoizedAvatar = memo<AvatarProps>(
    ({ src, name, size = 'md' }) => {
        const sizes = {
            sm: 'w-8 h-8 text-xs',
            md: 'w-10 h-10 text-sm',
            lg: 'w-12 h-12 text-base',
        };

        const initials = name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        if (src) {
            return (
                <img
                    src={src}
                    alt={name}
                    className={`${sizes[size]} rounded-full object-cover`}
                />
            );
        }

        return (
            <div
                className={`${sizes[size]} rounded-full bg-slate-200 flex items-center justify-center font-medium text-slate-600`}
            >
                {initials}
            </div>
        );
    }
);
MemoizedAvatar.displayName = 'MemoizedAvatar';

// ============================================================================
// PERFORMANCE HOOKS
// ============================================================================

/**
 * Memoize expensive list transformations
 */
export function useMemoizedList<T, R>(
    items: T[],
    transform: (item: T) => R,
    deps: React.DependencyList = []
): R[] {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => items.map(transform), [items, ...deps]);
}

/**
 * Memoize filtered results
 */
export function useMemoizedFilter<T>(
    items: T[],
    predicate: (item: T) => boolean,
    deps: React.DependencyList = []
): T[] {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => items.filter(predicate), [items, ...deps]);
}

/**
 * Memoize sorted results
 */
export function useMemoizedSort<T>(
    items: T[],
    compareFn: (a: T, b: T) => number,
    deps: React.DependencyList = []
): T[] {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => [...items].sort(compareFn), [items, ...deps]);
}

/**
 * Stable callback ref - prevents child re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
    const callbackRef = React.useRef(callback);
    callbackRef.current = callback;
    return useCallback(
        ((...args) => callbackRef.current(...args)) as T,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );
}

export default {
    MemoizedStatCard,
    MemoizedListItem,
    MemoizedTableRow,
    MemoizedBadge,
    MemoizedAvatar,
    useMemoizedList,
    useMemoizedFilter,
    useMemoizedSort,
    useStableCallback,
};
