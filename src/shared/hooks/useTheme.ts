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
  // Use lazy initializers to compute initial values synchronously
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = getStoredTheme();
    // Apply theme on initial render (side effect in initializer is OK for synchronization)
    if (typeof document !== 'undefined') {
      applyTheme(storedTheme);
    }
    return storedTheme;
  });

  // Compute effective theme synchronously (no need for separate state with effect)
  const effectiveTheme = getEffectiveTheme(theme);

  // Watch for system theme changes when theme is 'system'
  // Also handles theme application when theme changes
  useEffect(() => {
    // Apply theme when it changes
    applyTheme(theme);

    // Only watch system theme when in 'system' mode
    if (theme !== 'system') return;

    const cleanup = watchSystemTheme(() => {
      // Force re-render to recompute effectiveTheme
      setThemeState((current) => current);
      applyTheme('system');
    });

    return cleanup;
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
