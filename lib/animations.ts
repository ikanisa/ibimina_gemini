/**
 * Animation utilities and constants
 * Provides consistent animation classes and helpers
 */

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700
} as const;

// Tailwind animation classes
export const ANIMATIONS = {
  // Fade
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-300',
  fadeInFast: 'animate-in fade-in duration-150',
  
  // Slide
  slideInFromRight: 'animate-in slide-in-from-right duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left duration-300',
  slideInFromTop: 'animate-in slide-in-from-top duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',
  slideOutToRight: 'animate-out slide-out-to-right duration-300',
  slideOutToLeft: 'animate-out slide-out-to-left duration-300',
  
  // Zoom
  zoomIn: 'animate-in zoom-in-95 duration-300',
  zoomOut: 'animate-out zoom-out-95 duration-300',
  
  // Scale
  scaleIn: 'animate-in zoom-in-95 duration-300',
  scaleOut: 'animate-out zoom-out-95 duration-300',
  
  // Combined
  slideFadeIn: 'animate-in fade-in slide-in-from-right duration-300',
  slideFadeOut: 'animate-out fade-out slide-out-to-right duration-300',
  
  // Transitions
  transitionAll: 'transition-all duration-300 ease-in-out',
  transitionColors: 'transition-colors duration-200 ease-in-out',
  transitionTransform: 'transition-transform duration-300 ease-in-out',
  transitionOpacity: 'transition-opacity duration-200 ease-in-out',
  
  // Hover effects
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverLift: 'hover:-translate-y-1 transition-transform duration-200 shadow-lg',
  
  // Loading
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  
  // Stagger animations (for lists)
  stagger: (index: number) => ({
    style: {
      animationDelay: `${index * 50}ms`
    }
  })
} as const;

// Easing functions
export const EASING = {
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  linear: 'linear'
} as const;

/**
 * Creates a staggered animation delay
 */
export function getStaggerDelay(index: number, baseDelay: number = 50): string {
  return `${index * baseDelay}ms`;
}

/**
 * Animation variants for Framer Motion (if needed in future)
 */
export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideIn: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 }
  },
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 }
  }
};

