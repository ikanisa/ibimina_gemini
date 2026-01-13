/**
 * Feedback Animation Utilities
 * Success, error, and validation animations
 */

import { Variants } from 'framer-motion';

/**
 * Success animation (scale + fade)
 */
export const successVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2 },
  },
};

/**
 * Error shake animation
 */
export const errorShakeVariants: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

/**
 * Validation error pulse
 */
export const validationErrorVariants: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.15 },
  },
};

/**
 * Toast notification variants
 */
export const toastVariants: Variants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/**
 * Loading spinner variants
 */
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Progress bar animation
 */
export const progressBarVariants: Variants = {
  initial: { width: 0 },
  animate: {
    width: '100%',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};
