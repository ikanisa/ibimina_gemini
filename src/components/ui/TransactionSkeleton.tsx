/**
 * Enhanced Transaction Skeleton Loader
 * Provides smooth loading states with animations
 */

import React from 'react';
import { motion } from 'framer-motion';

interface TransactionSkeletonProps {
  count?: number;
  variant?: 'table' | 'card';
}

const SkeletonRow: React.FC<{ variant?: 'table' | 'card' }> = ({ variant = 'table' }) => {
  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
          </div>
          <div className="h-6 bg-slate-200 rounded w-20 animate-pulse" />
        </div>
        <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
        <div className="h-3 bg-slate-200 rounded w-40 animate-pulse" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-12 px-4 py-3 items-center border-b border-slate-100"
    >
      <div className="col-span-1">
        <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="col-span-2 space-y-1">
        <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
        <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
      </div>
      <div className="col-span-2 space-y-1">
        <div className="h-5 bg-slate-200 rounded w-24 animate-pulse" />
        <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
      </div>
      <div className="col-span-2 space-y-1">
        <div className="h-4 bg-slate-200 rounded w-28 animate-pulse" />
        <div className="h-3 bg-slate-200 rounded w-20 animate-pulse" />
      </div>
      <div className="col-span-2">
        <div className="h-3 bg-slate-200 rounded w-32 animate-pulse" />
      </div>
      <div className="col-span-1">
        <div className="h-6 bg-slate-200 rounded w-20 animate-pulse" />
      </div>
      <div className="col-span-2">
        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
      </div>
    </motion.div>
  );
};

export const TransactionSkeleton: React.FC<TransactionSkeletonProps> = ({ 
  count = 5, 
  variant = 'table' 
}) => {
  return (
    <div className={variant === 'card' ? 'p-4 space-y-3' : ''}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRow 
          key={index} 
          variant={variant}
        />
      ))}
    </div>
  );
};

/**
 * Shimmer effect for loading states
 */
export const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
};

/**
 * Pulse animation for loading indicators
 */
export const PulseLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full bg-blue-600`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};
