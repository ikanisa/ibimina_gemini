/**
 * useResponsive Hook
 * Detects screen size and device type for responsive behavior
 */

import { useState, useEffect } from 'react';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  width: number;
  height: number;
}

const breakpoints = {
  mobile: 640,
  tablet: 1024,
};

/**
 * Hook to detect responsive breakpoints and device type
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        width: 1920,
        height: 1080,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
      isDesktop: width >= breakpoints.tablet,
      isTouch,
      width,
      height,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setState({
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
        isDesktop: width >= breakpoints.tablet,
        isTouch,
        width,
        height,
      });
    };

    updateState();
    window.addEventListener('resize', updateState);
    return () => window.removeEventListener('resize', updateState);
  }, []);

  return state;
}

/**
 * Hook to detect if device is mobile only
 */
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

/**
 * Hook to detect if device is tablet or larger
 */
export function useIsTabletOrLarger(): boolean {
  const { isTablet, isDesktop } = useResponsive();
  return isTablet || isDesktop;
}

/**
 * Hook to detect if device has touch capability
 */
export function useIsTouch(): boolean {
  const { isTouch } = useResponsive();
  return isTouch;
}
