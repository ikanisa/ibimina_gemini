/**
 * Design System Tokens
 * Comprehensive design values for consistent, modern UI
 * Ibimina Gemini Fintech Platform
 */

export const DESIGN_TOKENS = {
    colors: {
        // Primary palette - Fintech blue
        primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6', // Main brand color
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554',
        },
        // Success - Green
        success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
        },
        // Error - Red
        error: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
        },
        // Warning - Amber
        warning: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
        },
        // Neutral - Gray
        neutral: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
            950: '#030712',
        },
    },

    spacing: {
        px: '1px',
        0: '0',
        0.5: '0.125rem', // 2px
        1: '0.25rem', // 4px
        1.5: '0.375rem', // 6px
        2: '0.5rem', // 8px
        2.5: '0.625rem', // 10px
        3: '0.75rem', // 12px
        3.5: '0.875rem', // 14px
        4: '1rem', // 16px
        5: '1.25rem', // 20px
        6: '1.5rem', // 24px
        7: '1.75rem', // 28px
        8: '2rem', // 32px
        9: '2.25rem', // 36px
        10: '2.5rem', // 40px
        12: '3rem', // 48px
        16: '4rem', // 64px
        20: '5rem', // 80px
        24: '6rem', // 96px
    },

    typography: {
        fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        },
        fontSize: {
            xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
            sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
            base: ['1rem', { lineHeight: '1.5rem' }], // 16px
            lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
            xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
            '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
            '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
            '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
        },
        fontWeight: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
        },
    },

    borderRadius: {
        none: '0',
        sm: '0.125rem', // 2px
        DEFAULT: '0.5rem', // 8px
        md: '0.625rem', // 10px
        lg: '0.75rem', // 12px
        xl: '1rem', // 16px
        '2xl': '1.5rem', // 24px
        '3xl': '2rem', // 32px
        full: '9999px',
        card: '0.75rem', // 12px (Explicit alias)
    },

    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    },

    animation: {
        duration: {
            fast: '150ms',
            base: '250ms',
            slow: '350ms',
            slower: '500ms',
        },
        easing: {
            linear: 'linear',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        },
    },

    zIndex: {
        dropdown: 10,
        sticky: 20,
        modal: 30,
        overlay: 40,
        toast: 50,
    },

    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
    },

    // Glass morphism tokens (merged from src/design/tokens.ts)
    glass: {
        bg: {
            light: 'rgba(255, 255, 255, 0.7)',
            medium: 'rgba(255, 255, 255, 0.5)',
            dark: 'rgba(255, 255, 255, 0.15)',
            darkMode: 'rgba(30, 41, 59, 0.7)',
            darkModeMedium: 'rgba(30, 41, 59, 0.5)',
        },
        border: {
            light: 'rgba(255, 255, 255, 0.3)',
            medium: 'rgba(255, 255, 255, 0.2)',
            dark: 'rgba(255, 255, 255, 0.1)',
            darkMode: 'rgba(148, 163, 184, 0.2)',
        },
        blur: {
            sm: '8px',
            md: '12px',
            lg: '24px',
            xl: '40px',
        },
        shadows: {
            soft: '0 4px 30px rgba(0, 0, 0, 0.08)',
            medium: '0 8px 32px rgba(0, 0, 0, 0.12)',
            hover: '0 12px 40px rgba(0, 0, 0, 0.15)',
            glow: '0 0 20px rgba(59, 130, 246, 0.4)',
            glowStrong: '0 0 30px rgba(59, 130, 246, 0.6)',
        },
    },

    // Reduced motion utilities
    motion: {
        reducedMotion: {
            transform: 'none',
            transition: 'none',
            animation: 'none',
        },
        durations: {
            instant: '0ms',
            fast: '150ms',
            normal: '250ms',
            slow: '350ms',
            slower: '500ms',
        },
        easings: {
            default: 'cubic-bezier(0.4, 0, 0.2, 1)',
            spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        },
    },
} as const;

// Export Tailwind config extension
export const tailwindExtension = {
    colors: DESIGN_TOKENS.colors,
    spacing: DESIGN_TOKENS.spacing,
    fontFamily: DESIGN_TOKENS.typography.fontFamily,
    fontSize: DESIGN_TOKENS.typography.fontSize,
    fontWeight: DESIGN_TOKENS.typography.fontWeight,
    borderRadius: DESIGN_TOKENS.borderRadius,
    boxShadow: {
        ...DESIGN_TOKENS.shadows,
        'glass-soft': DESIGN_TOKENS.glass.shadows.soft,
        'glass-medium': DESIGN_TOKENS.glass.shadows.medium,
        'glass-hover': DESIGN_TOKENS.glass.shadows.hover,
        'glass-glow': DESIGN_TOKENS.glass.shadows.glow,
    },
    transitionDuration: DESIGN_TOKENS.animation.duration,
    transitionTimingFunction: DESIGN_TOKENS.animation.easing,
    zIndex: DESIGN_TOKENS.zIndex,
    backdropBlur: DESIGN_TOKENS.glass.blur,
};

// Re-export individual tokens for convenience
export const { colors, spacing, typography, borderRadius, shadows, animation, zIndex, breakpoints, glass, motion } =
    DESIGN_TOKENS;

export default DESIGN_TOKENS;

