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
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-slate-200';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Can be enhanced with custom wave animation
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
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
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
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
    <div className="flex items-center gap-4 p-4 border-b border-slate-100 animate-in fade-in">
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
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
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

