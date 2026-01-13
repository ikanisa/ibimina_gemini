/**
 * Modern Input Component
 * Accessible input with focus states, dark mode, and forwardRef support
 */

import React, { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', error = false, helperText, ...props }, ref) => {
        return (
            <div className="w-full">
                <input
                    ref={ref}
                    className={cn(
                        // Base styles
                        'block w-full rounded-lg border px-4 py-2.5',
                        'text-neutral-900 dark:text-neutral-100',
                        'bg-white dark:bg-neutral-800',
                        'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                        // Focus states
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        'transition-all duration-200',
                        // Disabled states
                        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50 dark:disabled:bg-neutral-900',
                        // Touch target size
                        'min-h-[44px]',
                        // Conditional styles
                        error
                            ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
                            : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500 focus:ring-primary-500/20',
                        className
                    )}
                    aria-invalid={error}
                    {...props}
                />
                {helperText && (
                    <p
                        className={cn(
                            'mt-1.5 text-sm',
                            error ? 'text-error-600 dark:text-error-400' : 'text-neutral-500 dark:text-neutral-400'
                        )}
                    >
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
