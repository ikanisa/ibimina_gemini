/**
 * useTheme Hook
 * React hook for theme management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getStoredTheme,
  storeTheme,
  getEffectiveTheme,
  applyTheme,
  watchSystemTheme,
  type Theme,
} from '@/lib/theme/dark-mode';

export interface UseThemeReturn {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Hook for managing theme state
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() =>
    getEffectiveTheme(theme)
  );

  // Initialize theme on mount
  useEffect(() => {
    const initialTheme = getStoredTheme();
    setThemeState(initialTheme);
    setEffectiveTheme(getEffectiveTheme(initialTheme));
    applyTheme(initialTheme);
  }, []);

  // Watch for system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const cleanup = watchSystemTheme((systemTheme) => {
      setEffectiveTheme(systemTheme);
      applyTheme('system');
    });

    return cleanup;
  }, [theme]);

  // Update effective theme when theme changes
  useEffect(() => {
    const effective = getEffectiveTheme(theme);
    setEffectiveTheme(effective);
    applyTheme(theme);
  }, [theme]);

  // Set theme and persist
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    storeTheme(newTheme);
    applyTheme(newTheme);
  }, []);

  // Toggle between light and dark (skips 'system')
  const toggleTheme = useCallback(() => {
    const currentEffective = getEffectiveTheme(theme);
    const newTheme: Theme = currentEffective === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  return {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
  };
}
