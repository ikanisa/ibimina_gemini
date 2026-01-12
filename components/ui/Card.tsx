/**
 * Card Component
 * Consistent card container with optional header and content sections
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils/cn';
import { cardHover, transitions } from '../../lib/animations/framer-motion';

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
  const MotionDiv = hover || onClick ? motion.div : 'div';
  const motionProps = hover || onClick ? {
    variants: cardHover,
    initial: 'initial',
    whileHover: 'hover',
    whileTap: 'tap',
    transition: transitions.normal,
  } : {};

  return (
    <MotionDiv
      className={cn(
        'bg-white rounded-lg border border-slate-200',
        paddingClasses[padding],
        hover && 'hover:border-slate-300 transition-colors cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </MotionDiv>
  );
});

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
}) => (
  <div className={cn('mb-4 pb-4 border-b border-slate-100', className)}>
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
  <h3 className={cn('text-lg font-semibold text-slate-900', className)}>
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
  <div className={className}>{children}</div>
);
