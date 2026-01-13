/**
 * Animated Card Component
 * Interactive card with hover scale and lift effects
 */

import React from 'react';
import { motion, type MotionProps } from 'framer-motion';
import { cn } from '../../lib/utils/cn';

export interface AnimatedCardProps extends Omit<MotionProps, 'children'> {
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    className = '',
    disabled = false,
    onClick,
    ...motionProps
}) => {
    return (
        <motion.div
            whileHover={disabled ? undefined : { scale: 1.02, y: -4 }}
            whileTap={disabled ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={disabled ? undefined : onClick}
            className={cn(
                'bg-white dark:bg-neutral-800',
                'rounded-xl shadow-md',
                'border border-neutral-200 dark:border-neutral-700',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                className
            )}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick && !disabled ? 0 : undefined}
            onKeyDown={onClick && !disabled ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            } : undefined}
            {...motionProps}
        >
            {children}
        </motion.div>
    );
};

// Variant with entrance animation
export const AnimatedCardWithEntrance: React.FC<AnimatedCardProps & { delay?: number }> = ({
    children,
    className = '',
    delay = 0,
    ...props
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay, ease: 'easeOut' }}
        >
            <AnimatedCard className={className} {...props}>
                {children}
            </AnimatedCard>
        </motion.div>
    );
};

export default AnimatedCard;
