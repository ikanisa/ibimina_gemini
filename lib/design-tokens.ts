/**
 * Design System Tokens
 * Centralized design values for consistent UI
 */

export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb', // Main primary
    700: '#1d4ed8',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a', // Main success
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706', // Main warning
    700: '#b45309',
  },
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626', // Main danger
    700: '#b91c1c',
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
} as const;

export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
} as const;

export const borderRadius = {
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'sans-serif'],
    mono: ['Menlo', 'Monaco', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
} as const;

export const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
} as const;

export const easing = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const zIndex = {
  dropdown: 10,
  sticky: 20,
  modal: 30,
  overlay: 40,
  toast: 50,
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Consolidated design tokens export
export const tokens = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  transitions,
  easing,
  zIndex,
  breakpoints,
} as const;

export default tokens;

