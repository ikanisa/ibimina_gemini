/**
 * Reusable Button Component
 * 
 * Accessible button with focus styles and ARIA support
 * Uses design tokens for consistent styling
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getButtonVariantStyles, getButtonSizeStyles } from '../../lib/utils/component-variants';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Loading text for screen readers */
  loadingText?: string;
}

// Variant classes generated from design tokens
const getVariantClass = (variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline') => {
  return getButtonVariantStyles(variant).classNameTailwind;
};

const getSizeClass = (size: 'sm' | 'md' | 'lg') => {
  return getButtonSizeStyles(size).classNameTailwind;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  loadingText = 'Loading...',
  type = 'button',
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`
        inline-flex items-center justify-center gap-2
        transition-all duration-200 ease-in-out
        ${getVariantClass(variant)}
        ${getSizeClass(size)}
        ${className}
      `}
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
    </motion.button>
  );
});

Button.displayName = 'Button';

