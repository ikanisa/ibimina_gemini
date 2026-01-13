/**
 * Animation Utilities Index
 * Centralized exports for all animation utilities
 */

// Transitions
export {
  fadeVariants,
  slideVariants,
  slideLeftVariants,
  slideTopVariants,
  slideBottomVariants,
  scaleVariants,
  defaultTransition,
  fastTransition,
  slowTransition,
  springTransition,
} from './transitions';

// Micro-interactions
export {
  hoverScale,
  hoverLift,
  tapScale,
  buttonHoverVariants,
  cardHoverVariants,
  iconHoverVariants,
  focusRing,
} from './micro-interactions';

// Feedback animations
export {
  successVariants,
  errorShakeVariants,
  validationErrorVariants,
  toastVariants,
  spinnerVariants,
  progressBarVariants,
} from './feedback';

// Re-export from existing animations file
export {
  ANIMATION_DURATION,
  ANIMATIONS,
  EASING,
  getStaggerDelay,
  animationVariants,
} from '../animations';
