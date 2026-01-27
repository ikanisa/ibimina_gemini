/**
 * useTheme Hook
 * React hook for theme management
 */

import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  getStoredTheme,
  storeTheme,
  getEffectiveTheme,
  applyTheme,
  watchSystemTheme,
  type Theme,
} from '../lib/theme/dark-mode';

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
  // Use lazy initialization to get stored theme and apply it synchronously
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    // Apply theme immediately during initialization to avoid flash
    applyTheme(stored);
    return stored;
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() =>
    getEffectiveTheme(theme)
  );

  // Watch for system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const cleanup = watchSystemTheme((systemTheme) => {
      setEffectiveTheme(systemTheme);
      applyTheme('system');
    });

    return cleanup;
  }, [theme]);

  // Update effective theme when theme changes (derived state)
  // Using useLayoutEffect to ensure synchronous update before paint
  useLayoutEffect(() => {
    const effective = getEffectiveTheme(theme);
    setEffectiveTheme(effective);
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
