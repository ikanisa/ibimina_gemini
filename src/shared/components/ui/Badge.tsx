/**
 * Reusable Badge Component
 * Semantic badges with dark mode support
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center font-medium rounded-full border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600',
        success: 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800',
        warning: 'bg-warning-50 text-warning-700 border-warning-100 dark:bg-warning-900/30 dark:text-warning-400 dark:border-warning-800',
        danger: 'bg-error-50 text-error-700 border-error-100 dark:bg-error-900/30 dark:text-error-400 dark:border-error-800',
        info: 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  size,
  className = '',
}) => {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {children}
    </span>
  );
};

// Export variants for external use
export { badgeVariants };
