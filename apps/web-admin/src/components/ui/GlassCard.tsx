/**
 * GlassCard Component
 * 
 * Premium glass-morphism card with hover animations and subtle effects.
 * Implements the "Soft Liquid Glass" design system.
 */

import React, { memo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export interface GlassCardProps {
    children: ReactNode;
    className?: string;
    /** Accent color variant */
    variant?: 'default' | 'blue' | 'green' | 'amber' | 'purple' | 'rose';
    /** Enable hover scale effect */
    hoverable?: boolean;
    /** Animation delay for staggered entry */
    delay?: number;
    /** Click handler */
    onClick?: () => void;
    /** Test ID for e2e tests */
    testId?: string;
}

const variantStyles: Record<string, string> = {
    default: 'border-white/20 bg-white/80 hover:bg-white/90',
    blue: 'border-blue-200/30 bg-gradient-to-br from-blue-50/80 to-white/80 hover:from-blue-100/90',
    green: 'border-green-200/30 bg-gradient-to-br from-green-50/80 to-white/80 hover:from-green-100/90',
    amber: 'border-amber-200/30 bg-gradient-to-br from-amber-50/80 to-white/80 hover:from-amber-100/90',
    purple: 'border-purple-200/30 bg-gradient-to-br from-purple-50/80 to-white/80 hover:from-purple-100/90',
    rose: 'border-rose-200/30 bg-gradient-to-br from-rose-50/80 to-white/80 hover:from-rose-100/90',
};

export const GlassCard = memo<GlassCardProps>(({
    children,
    className,
    variant = 'default',
    hoverable = true,
    delay = 0,
    onClick,
    testId,
}) => {
    const isClickable = !!onClick;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
            whileHover={hoverable ? {
                scale: 1.02,
                boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.1)'
            } : undefined}
            whileTap={isClickable ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={cn(
                // Base glass effect
                'rounded-2xl border backdrop-blur-xl shadow-lg shadow-slate-200/50',
                // Transition
                'transition-all duration-300 ease-out',
                // Variant
                variantStyles[variant],
                // Clickable styling
                isClickable && 'cursor-pointer',
                className
            )}
            data-testid={testId}
        >
            {children}
        </motion.div>
    );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;
