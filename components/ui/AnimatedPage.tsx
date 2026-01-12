/**
 * Animated Page Component
 * Wraps pages with Framer Motion animations for smooth transitions
 */

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
  initial?: 'fade' | 'slide' | 'scale';
  exit?: 'fade' | 'slide' | 'scale';
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  className = '',
  initial = 'fade',
  exit = 'fade',
}) => {
  const variant = variants[initial];
  const exitVariant = variants[exit];

  return (
    <motion.div
      initial={variant.initial}
      animate={variant.animate}
      exit={exitVariant.exit}
      transition={{
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1], // easeInOut
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
