/**
 * Reusable Button Component
 * 
 * Accessible button with focus styles, dark mode, and ARIA support
 */

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  // Base styles
  `inline-flex items-center justify-center gap-2
   font-medium rounded-lg
   transition-all duration-200 ease-in-out
   motion-safe:active:scale-[0.98]
   touch-manipulation
   disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`,
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white shadow-md hover:bg-primary-500 hover:shadow-lg active:bg-primary-700 focus-visible:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400',
        secondary: 'bg-white text-neutral-900 border border-neutral-200 shadow-sm hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 focus-visible:ring-neutral-500 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-700',
        danger: 'bg-error-600 text-white shadow-sm hover:bg-error-500 active:bg-error-700 focus-visible:ring-error-500 dark:bg-error-500 dark:hover:bg-error-400',
        ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 focus-visible:ring-neutral-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
        outline: 'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50/50 active:bg-primary-100/50 focus-visible:ring-primary-500 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20',
        glass: 'bg-white/70 dark:bg-neutral-800/70 backdrop-blur-md text-neutral-900 dark:text-neutral-100 border border-white/20 dark:border-neutral-600/30 shadow-glass-soft hover:shadow-glass-glow hover:border-primary-500/30 dark:hover:border-primary-400/30 focus-visible:ring-primary-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Loading text for screen readers */
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      loadingText = 'Loading...',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            <span>{loadingText}</span>
            <span className="sr-only">Please wait</span>
          </>
        ) : (
          <>
            {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Export variants for external use
export { buttonVariants };
