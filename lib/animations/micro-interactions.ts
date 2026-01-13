/**
 * Micro-interaction Utilities
 * Provides hover, click, and focus animations
 */

import { Variants } from 'framer-motion';

/**
 * Hover scale animation
 */
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.15, ease: 'easeOut' },
};

/**
 * Hover lift animation (scale + translateY)
 */
export const hoverLift = {
  scale: 1.02,
  y: -2,
  transition: { duration: 0.15, ease: 'easeOut' },
};

/**
 * Tap/Click animation
 */
export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1, ease: 'easeOut' },
};

/**
 * Button hover variants
 */
export const buttonHoverVariants: Variants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1, ease: 'easeOut' },
  },
};

/**
 * Card hover variants
 */
export const cardHoverVariants: Variants = {
  hover: {
    y: -4,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

/**
 * Icon hover variants
 */
export const iconHoverVariants: Variants = {
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  tap: {
    scale: 0.9,
    transition: { duration: 0.1, ease: 'easeOut' },
  },
};

/**
 * Focus ring animation
 */
export const focusRing = {
  boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.5)',
  transition: { duration: 0.15, ease: 'easeOut' },
};
