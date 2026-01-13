/**
 * useResponsive Hook
 * React hook for responsive design and mobile detection
 */

import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveState {
  /** Current breakpoint */
  breakpoint: Breakpoint;
  /** Whether screen is mobile (< 768px) */
  isMobile: boolean;
  /** Whether screen is tablet (768px - 1024px) */
  isTablet: boolean;
  /** Whether screen is desktop (> 1024px) */
  isDesktop: boolean;
  /** Whether device supports touch */
  isTouch: boolean;
  /** Screen width */
  width: number;
  /** Screen height */
  height: number;
}

/**
 * Get breakpoint from width
 */
function getBreakpoint(width: number): Breakpoint {
  if (width >= 1536) return '2xl';
  if (width >= 1280) return 'xl';
  if (width >= 1024) return 'lg';
  if (width >= 768) return 'md';
  if (width >= 640) return 'sm';
  return 'xs';
}

/**
 * Hook for responsive design
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        breakpoint: 'lg',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        width: 1024,
        height: 768,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      breakpoint,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isTouch,
      width,
      height,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const breakpoint = getBreakpoint(width);
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setState({
        breakpoint,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isTouch,
        width,
        height,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return state;
}

/**
 * Hook for mobile detection only
 */
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

/**
 * Hook for touch detection
 */
export function useIsTouch(): boolean {
  const { isTouch } = useResponsive();
  return isTouch;
}
