/**
 * Animated Button Component
 * Enhanced Button with Framer Motion animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Button, ButtonProps } from './Button';

interface AnimatedButtonProps extends ButtonProps {
  animateOnHover?: boolean;
  animateOnClick?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  animateOnHover = true,
  animateOnClick = true,
  children,
  ...buttonProps
}) => {
  return (
    <motion.div
      whileHover={animateOnHover ? { scale: 1.02 } : undefined}
      whileTap={animateOnClick ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <Button {...buttonProps}>{children}</Button>
    </motion.div>
  );
};
