/**
 * Animated Page Component
 * Wraps page content with smooth entrance/exit animations
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AnimatedPageProps {
    children: React.ReactNode;
    className?: string;
}

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

const pageTransition = {
    duration: 0.3,
    ease: 'easeOut' as const,
};

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className = '' }) => {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// For use with route transitions
export const AnimatedPageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <AnimatePresence mode="wait">{children}</AnimatePresence>;
};

export default AnimatedPage;
