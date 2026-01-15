/**
 * UnallocatedActionsCard Component
 * 
 * Prominent action card for unallocated transactions that need attention.
 * Features attention-grabbing animation when count > 0.
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { GlassCard } from '@/components/ui/GlassCard';
import { ViewState } from '@/core/types';

export interface UnallocatedActionsCardProps {
    /** Number of unallocated transactions */
    count: number;
    /** Amount total of unallocated transactions */
    amount?: number;
    /** Currency code */
    currency?: string;
    /** Navigation handler */
    onNavigate: (view: ViewState) => void;
    /** Animation delay */
    delay?: number;
}

export const UnallocatedActionsCard = memo<UnallocatedActionsCardProps>(({
    count,
    amount = 0,
    currency = 'RWF',
    onNavigate,
    delay = 0,
}) => {
    const hasItems = count > 0;

    return (
        <GlassCard
            variant={hasItems ? 'amber' : 'green'}
            delay={delay}
            className={cn(
                'p-5 relative overflow-hidden',
                hasItems && 'ring-2 ring-amber-300/50'
            )}
            testId="unallocated-actions-card"
        >
            {/* Animated attention pulse for urgent items */}
            <AnimatePresence>
                {hasItems && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.05, 1]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                        className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl"
                    />
                )}
            </AnimatePresence>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                    <motion.div
                        animate={hasItems ? {
                            rotate: [0, -5, 5, -5, 0],
                            transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
                        } : {}}
                        className={cn(
                            'p-2.5 rounded-xl',
                            hasItems ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                        )}
                    >
                        {hasItems ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                    </motion.div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                            Unallocated Collections
                        </h3>
                        <p className="text-xs text-slate-500">
                            {hasItems ? 'Requires attention' : 'All clear'}
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-4">
                    <motion.p
                        key={count}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn(
                            'text-3xl font-bold',
                            hasItems ? 'text-amber-900' : 'text-green-700'
                        )}
                    >
                        {count.toLocaleString()}
                    </motion.p>

                    {hasItems && amount > 0 && (
                        <p className="text-sm text-amber-700 mt-1">
                            {amount.toLocaleString()} {currency} pending
                        </p>
                    )}
                </div>

                {/* Action Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate(ViewState.TRANSACTIONS)}
                    className={cn(
                        'w-full flex items-center justify-center gap-2 py-2.5 px-4',
                        'rounded-xl font-medium text-sm transition-all duration-200',
                        hasItems
                            ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/25'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                    )}
                >
                    {hasItems ? 'Review Now' : 'View Transactions'}
                    <ArrowRight size={16} />
                </motion.button>
            </div>
        </GlassCard>
    );
});

UnallocatedActionsCard.displayName = 'UnallocatedActionsCard';

export default UnallocatedActionsCard;
