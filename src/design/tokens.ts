// src/design/tokens.ts
export const tokens = {
    colors: {
        glass: {
            light: 'rgba(255, 255, 255, 0.7)',
            medium: 'rgba(255, 255, 255, 0.4)',
            dark: 'rgba(255, 255, 255, 0.1)',
            border: 'rgba(255, 255, 255, 0.2)',
            text: '#1e293b',
            muted: '#64748b',
        },
        primary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
    },
    blur: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
    },
    transitions: {
        fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    shadows: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
        glassHover: '0 10px 40px rgba(0, 0, 0, 0.1)',
        glow: '0 0 20px rgba(59, 130, 246, 0.5)',
    }
};
