/**
 * Shimmer Skeleton Component
 * Enhanced skeleton loader with smooth shimmer animation
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ShimmerSkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height,
    lines = 1,
}) => {
    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-lg',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    if (lines > 1 && variant === 'text') {
        return (
            <div className={cn('space-y-2', className)}>
                {Array.from({ length: lines }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            'bg-slate-200 dark:bg-neutral-700',
                            'animate-shimmer',
                            variantClasses[variant],
                            index === lines - 1 ? 'w-3/4' : 'w-full'
                        )}
                        style={{ height: height || 16 }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'bg-slate-200 dark:bg-neutral-700',
                'animate-shimmer',
                variantClasses[variant],
                className
            )}
            style={style}
        />
    );
};

/**
 * Card Shimmer Skeleton
 */
export const CardShimmer: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={cn('bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-6', className)}>
            <div className="flex items-start justify-between mb-4">
                <ShimmerSkeleton variant="circular" width={48} height={48} />
                <ShimmerSkeleton variant="rounded" width={60} height={24} />
            </div>
            <ShimmerSkeleton variant="text" width="60%" height={24} className="mb-2" />
            <ShimmerSkeleton variant="text" width="80%" height={16} />
        </div>
    );
};

/**
 * Table Row Shimmer
 */
export const TableRowShimmer: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
    return (
        <tr className="border-b border-slate-100 dark:border-neutral-700">
            {Array.from({ length: columns }).map((_, idx) => (
                <td key={idx} className="px-4 py-3">
                    <ShimmerSkeleton variant="text" width={idx === 0 ? '40%' : '70%'} height={16} />
                </td>
            ))}
        </tr>
    );
};

/**
 * List Item Shimmer
 */
export const ListItemShimmer: React.FC = () => {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-neutral-700">
            <ShimmerSkeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
                <ShimmerSkeleton variant="text" width="40%" height={16} />
                <ShimmerSkeleton variant="text" width="60%" height={14} />
            </div>
            <ShimmerSkeleton variant="rounded" width={80} height={32} />
        </div>
    );
};

/**
 * Stats Grid Shimmer
 */
export const StatsGridShimmer: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, idx) => (
                <CardShimmer key={idx} />
            ))}
        </div>
    );
};

/**
 * Page Content Shimmer
 */
export const PageContentShimmer: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <ShimmerSkeleton variant="text" width={200} height={28} />
                    <ShimmerSkeleton variant="text" width={150} height={16} />
                </div>
                <ShimmerSkeleton variant="rounded" width={120} height={40} />
            </div>

            {/* Stats */}
            <StatsGridShimmer count={4} />

            {/* Content */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-6">
                <ShimmerSkeleton variant="text" width={150} height={20} className="mb-4" />
                <div className="space-y-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                        <ListItemShimmer key={idx} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShimmerSkeleton;
