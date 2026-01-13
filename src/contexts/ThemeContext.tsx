/**
 * Theme Context
 * Provides light/dark/system theme support with persistence
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'ibimina-theme';

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
}

function getStoredTheme(): Theme {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
    }
    return 'system';
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
        const initialTheme = getStoredTheme();
        return initialTheme === 'system' ? getSystemTheme() : initialTheme;
    });

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, newTheme);
        }
    };

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (activeTheme: 'light' | 'dark') => {
            root.classList.remove('light', 'dark');
            root.classList.add(activeTheme);
            setResolvedTheme(activeTheme);
        };

        if (theme === 'system') {
            const systemTheme = getSystemTheme();
            applyTheme(systemTheme);

            // Listen for system theme changes
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                applyTheme(e.matches ? 'dark' : 'light');
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            applyTheme(theme);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
