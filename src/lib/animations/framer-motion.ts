/**
 * Framer Motion Animation Variants
 * Reusable animation configurations for consistent animations across the app
 */

import { Variants } from 'framer-motion';

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// ============================================================================
// SLIDE ANIMATIONS
// ============================================================================

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const scaleInCenter: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// ============================================================================
// CARD ANIMATIONS
// ============================================================================

export const cardHover: Variants = {
  initial: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -2 },
  tap: { scale: 0.98 },
};

export const cardStagger: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

// ============================================================================
// MODAL/DRAWER ANIMATIONS
// ============================================================================

export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

export const drawerSlide: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

export const loadingPulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const loadingSpin: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================================================
// TRANSITION CONFIGS
// ============================================================================

export const transitions = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  normal: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  slow: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  springGentle: { type: 'spring', stiffness: 200, damping: 25 },
};

// ============================================================================
// STAGGER CONFIG
// ============================================================================

export const staggerConfig = {
  container: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
};
