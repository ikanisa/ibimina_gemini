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
  blur?: 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const blurClasses = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
};

export const Card: React.FC<CardProps> = React.memo(({
  children,
  className,
  padding = 'md',
  hover = false,
  onClick,
  blur = 'md',
  gradient = false,
}) => {
  return (
    <div
      className={cn(
        // Base glass styles
        'bg-white/80 dark:bg-neutral-900/80',
        blurClasses[blur],
        'rounded-lg',
        // Border styling
        gradient
          ? 'border border-transparent bg-clip-padding shadow-glass-soft'
          : 'border border-neutral-200/50 dark:border-neutral-700/50',
        'shadow-sm',
        paddingClasses[padding],
        // Hover effects with motion-safe
        hover && 'motion-safe:transition-all motion-safe:duration-300 hover:shadow-glass-hover hover:-translate-y-1 hover:border-primary-500/20 dark:hover:border-primary-500/20',
        onClick && 'cursor-pointer motion-safe:active:scale-[0.99]',
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
      {gradient && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary-500/10 via-transparent to-primary-500/5 pointer-events-none" />
      )}
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
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
  padding,
}) => (
  <div className={cn('text-neutral-700 dark:text-neutral-300', padding && paddingClasses[padding], className)}>{children}</div>
);
