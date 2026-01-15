/**
 * Skeleton Loader Components
 * 
 * Provides loading placeholders for better perceived performance
 */

import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
  glass?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  glass = false
}) => {
  const baseClasses = glass
    ? 'bg-white/30 dark:bg-neutral-700/30 backdrop-blur-sm'
    : 'bg-neutral-200 dark:bg-neutral-700';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'motion-safe:animate-pulse',
    shimmer: 'motion-safe:animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 bg-[length:200%_100%]',
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${animation === 'shimmer' ? '' : baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr className="animate-in fade-in">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-6 py-4">
          <Skeleton variant="text" width="80%" height={16} />
        </td>
      ))}
    </tr>
  );
};

/**
 * Card Skeleton
 */
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-6 space-y-4 animate-in fade-in">
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="80%" height={16} />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="rounded" width={100} height={36} />
        <Skeleton variant="rounded" width={100} height={36} />
      </div>
    </div>
  );
};

/**
 * List Item Skeleton
 */
export const ListItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-neutral-700 animate-in fade-in">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="40%" height={16} />
        <Skeleton variant="text" width="60%" height={14} />
      </div>
      <Skeleton variant="rounded" width={80} height={32} />
    </div>
  );
};

/**
 * Dashboard Stats Skeleton
 */
export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-sm animate-in fade-in">
      <div className="flex justify-between items-start mb-4">
        <Skeleton variant="rounded" width={48} height={48} />
        <Skeleton variant="text" width={60} height={16} />
      </div>
      <Skeleton variant="text" width="50%" height={32} className="mb-2" />
      <Skeleton variant="text" width="70%" height={14} />
    </div>
  );
};

/**
 * Form Field Skeleton
 */
export const FormFieldSkeleton: React.FC = () => {
  return (
    <div className="space-y-2 animate-in fade-in">
      <Skeleton variant="text" width="30%" height={14} />
      <Skeleton variant="rounded" width="100%" height={40} />
    </div>
  );
};

