/**
 * Component Variants Generator
 * Creates consistent component variants using design tokens
 */

import { tokens } from '../design-tokens';

/**
 * Generate button variant styles from design tokens
 */
export function getButtonVariantStyles(variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline') {
  const baseStyles = 'font-medium rounded-lg transition-all touch-manipulation min-h-[44px] min-w-[44px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const variants = {
    primary: {
      className: `${baseStyles} bg-[${tokens.colors.primary[600]}] text-white hover:bg-[${tokens.colors.primary[700]}] disabled:bg-[${tokens.colors.primary[500]}] focus-visible:ring-[${tokens.colors.primary[600]}]`,
      // Using Tailwind classes for better compatibility
      classNameTailwind: `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 focus-visible:ring-blue-500`,
    },
    secondary: {
      className: `${baseStyles} bg-[${tokens.colors.neutral[100]}] text-[${tokens.colors.neutral[700]}] hover:bg-[${tokens.colors.neutral[200]}] disabled:bg-[${tokens.colors.neutral[50]}] focus-visible:ring-[${tokens.colors.neutral[500]}]`,
      classNameTailwind: `${baseStyles} bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:bg-slate-50 focus-visible:ring-slate-500`,
    },
    danger: {
      className: `${baseStyles} bg-[${tokens.colors.danger[600]}] text-white hover:bg-[${tokens.colors.danger[700]}] disabled:bg-[${tokens.colors.danger[500]}] focus-visible:ring-[${tokens.colors.danger[600]}]`,
      classNameTailwind: `${baseStyles} bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 focus-visible:ring-red-500`,
    },
    ghost: {
      className: `${baseStyles} bg-transparent text-[${tokens.colors.neutral[700]}] hover:bg-[${tokens.colors.neutral[100]}] disabled:text-[${tokens.colors.neutral[400]}] focus-visible:ring-[${tokens.colors.neutral[500]}]`,
      classNameTailwind: `${baseStyles} bg-transparent text-slate-700 hover:bg-slate-100 disabled:text-slate-400 focus-visible:ring-slate-500`,
    },
    outline: {
      className: `${baseStyles} bg-white border border-[${tokens.colors.neutral[300]}] text-[${tokens.colors.neutral[700]}] hover:bg-[${tokens.colors.neutral[50]}] disabled:border-[${tokens.colors.neutral[200]}] focus-visible:ring-[${tokens.colors.neutral[500]}]`,
      classNameTailwind: `${baseStyles} bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:border-slate-200 focus-visible:ring-slate-500`,
    },
  };

  return variants[variant];
}

/**
 * Generate button size styles from design tokens
 */
export function getButtonSizeStyles(size: 'sm' | 'md' | 'lg') {
  const sizes = {
    sm: {
      padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
      fontSize: tokens.typography.fontSize.sm,
      classNameTailwind: 'px-3 py-1.5 text-sm',
    },
    md: {
      padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
      fontSize: tokens.typography.fontSize.sm,
      classNameTailwind: 'px-4 py-2 text-sm',
    },
    lg: {
      padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
      fontSize: tokens.typography.fontSize.base,
      classNameTailwind: 'px-6 py-3 text-base',
    },
  };

  return sizes[size];
}

/**
 * Generate badge variant styles from design tokens
 */
export function getBadgeVariantStyles(variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral') {
  const baseStyles = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';

  const variants = {
    success: {
      classNameTailwind: `${baseStyles} bg-green-100 text-green-800 border border-green-200`,
    },
    warning: {
      classNameTailwind: `${baseStyles} bg-amber-100 text-amber-800 border border-amber-200`,
    },
    danger: {
      classNameTailwind: `${baseStyles} bg-red-100 text-red-800 border border-red-200`,
    },
    info: {
      classNameTailwind: `${baseStyles} bg-blue-100 text-blue-800 border border-blue-200`,
    },
    neutral: {
      classNameTailwind: `${baseStyles} bg-slate-100 text-slate-800 border border-slate-200`,
    },
  };

  return variants[variant];
}

/**
 * Generate card variant styles from design tokens
 */
export function getCardVariantStyles(variant: 'default' | 'elevated' | 'outlined' | 'flat') {
  const baseStyles = 'bg-white rounded-lg';

  const variants = {
    default: {
      classNameTailwind: `${baseStyles} border border-slate-200 shadow-sm`,
    },
    elevated: {
      classNameTailwind: `${baseStyles} border border-slate-200 shadow-md`,
    },
    outlined: {
      classNameTailwind: `${baseStyles} border-2 border-slate-300`,
    },
    flat: {
      classNameTailwind: `${baseStyles} border-0 shadow-none`,
    },
  };

  return variants[variant];
}
