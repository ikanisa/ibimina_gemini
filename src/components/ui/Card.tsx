/**
 * Card Component
 * Consistent card container with dark mode and hover effects
 */

import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = React.memo(({
  children,
  className,
  padding = 'md',
  hover = false,
  onClick,
}) => {
  return (
    <div
      className={cn(
        // Base styles
        'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md',
        'rounded-lg border', // 12px radius as per design system lg
        'border-neutral-200/50 dark:border-neutral-700/50',
        'shadow-sm',
        paddingClasses[padding],
        // Hover effects
        hover && 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary-500/20 dark:hover:border-primary-500/20',
        onClick && 'cursor-pointer active:scale-[0.99]',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
}) => (
  <div className={cn('mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-700', className)}>
    {children}
  </div>
);

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className,
}) => (
  <h3 className={cn('text-lg font-semibold text-neutral-900 dark:text-neutral-100', className)}>
    {children}
  </h3>
);

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
}) => (
  <div className={cn('text-neutral-700 dark:text-neutral-300', className)}>{children}</div>
);
