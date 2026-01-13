/**
 * Page Transition Utilities
 * Provides consistent page transitions using Framer Motion
 */

import { Variants } from 'framer-motion';

/**
 * Fade transition variants
 */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Slide transition variants
 */
export const slideVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/**
 * Slide from left
 */
export const slideLeftVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * Slide from top
 */
export const slideTopVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

/**
 * Slide from bottom
 */
export const slideBottomVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * Scale transition variants
 */
export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/**
 * Default transition configuration
 */
export const defaultTransition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number], // easeInOut
};

/**
 * Fast transition (150ms)
 */
export const fastTransition = {
  duration: 0.15,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

/**
 * Slow transition (300ms)
 */
export const slowTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

/**
 * Spring transition
 */
export const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};
