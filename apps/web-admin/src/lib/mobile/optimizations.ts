/**
 * Mobile Optimization Utilities
 * Utilities for mobile-specific optimizations
 */

/**
 * Minimum touch target size (44x44px as per WCAG)
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Check if element meets minimum touch target size
 */
export function meetsTouchTargetSize(
  width: number,
  height: number
): boolean {
  return width >= MIN_TOUCH_TARGET && height >= MIN_TOUCH_TARGET;
}

/**
 * Get touch target classes for minimum size
 */
export function getTouchTargetClasses(): string {
  return `min-w-[${MIN_TOUCH_TARGET}px] min-h-[${MIN_TOUCH_TARGET}px]`;
}

/**
 * Optimize images for mobile
 */
export interface ImageOptimization {
  src: string;
  srcSet?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Generate responsive image attributes
 */
export function optimizeImageForMobile(
  src: string,
  options: {
    widths?: number[];
    sizes?: string;
    loading?: 'lazy' | 'eager';
  } = {}
): ImageOptimization {
  const { widths = [320, 640, 1024], sizes, loading = 'lazy' } = options;

  const srcSet = widths
    .map((width) => `${src}?w=${width} ${width}w`)
    .join(', ');

  const defaultSizes =
    sizes ||
    '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return {
    src,
    srcSet,
    sizes: defaultSizes,
    loading,
  };
}

/**
 * Debounce function for mobile scroll/resize events
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for mobile scroll/resize events
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Prevent zoom on double tap (iOS Safari)
 */
export function preventDoubleTapZoom(element: HTMLElement): () => void {
  let lastTouchEnd = 0;

  const handleTouchEnd = (event: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  };

  element.addEventListener('touchend', handleTouchEnd, { passive: false });

  return () => {
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Get safe area insets (for notched devices)
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
    right: parseInt(
      style.getPropertyValue('--safe-area-inset-right') || '0',
      10
    ),
    bottom: parseInt(
      style.getPropertyValue('--safe-area-inset-bottom') || '0',
      10
    ),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
  };
}

/**
 * Check if device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  return isIOS() || isAndroid();
}
