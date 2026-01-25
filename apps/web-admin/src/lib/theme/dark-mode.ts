/**
 * Dark Mode Utilities
 * Theme management and persistence
 */

export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'ibimina-theme';

/**
 * Get the current theme from localStorage
 */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

/**
 * Store theme preference in localStorage
 */
export function storeTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Get system preference (light or dark)
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Get effective theme (resolves 'system' to actual theme)
 */
export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  
  const effectiveTheme = getEffectiveTheme(theme);
  const root = document.documentElement;
  
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      effectiveTheme === 'dark' ? '#0f172a' : '#ffffff'
    );
  }
}

/**
 * Initialize theme on page load
 */
export function initializeTheme(): Theme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

/**
 * Listen for system theme changes
 */
export function watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op cleanup
  }
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }
  
  // Fallback for older browsers
  mediaQuery.addListener(handleChange);
  return () => mediaQuery.removeListener(handleChange);
}
