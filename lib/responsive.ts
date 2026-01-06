/**
 * Responsive design utilities
 * Provides breakpoints and responsive helpers
 */

// Tailwind breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// Touch target minimum size (WCAG recommendation)
export const TOUCH_TARGET_MIN = 44; // pixels

/**
 * Responsive class utilities
 */
export const RESPONSIVE = {
  // Hide/show at breakpoints
  hideMobile: 'hidden md:block',
  hideDesktop: 'block md:hidden',
  hideTablet: 'hidden lg:block',
  
  // Grid columns
  gridColsMobile: 'grid-cols-1',
  gridColsTablet: 'md:grid-cols-2',
  gridColsDesktop: 'lg:grid-cols-3 xl:grid-cols-4',
  
  // Text sizes
  textMobile: 'text-sm',
  textTablet: 'md:text-base',
  textDesktop: 'lg:text-lg',
  
  // Spacing
  paddingMobile: 'p-4',
  paddingTablet: 'md:p-6',
  paddingDesktop: 'lg:p-8',
  
  // Container
  containerMobile: 'w-full px-4',
  containerTablet: 'md:max-w-2xl md:mx-auto',
  containerDesktop: 'lg:max-w-7xl lg:mx-auto'
} as const;

/**
 * Check if device is touch-enabled
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get viewport dimensions
 */
export function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/**
 * Check if current viewport matches breakpoint
 */
export function matchesBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const width = window.innerWidth;
  const breakpointValue = parseInt(BREAKPOINTS[breakpoint]);
  return width >= breakpointValue;
}

/**
 * Responsive value helper (returns different values based on breakpoint)
 */
export function responsive<T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): string {
  let classes = '';
  if (mobile) classes += `${mobile} `;
  if (tablet) classes += `md:${tablet} `;
  if (desktop) classes += `lg:${desktop}`;
  return classes.trim();
}

