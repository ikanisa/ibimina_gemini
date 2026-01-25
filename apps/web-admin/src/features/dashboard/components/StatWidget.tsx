/**
 * StatWidget Component
 * 
 * Enhanced KPI widget with glass styling, icon, trend indicator,
 * and smooth animations.
 */

import React, { memo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { GlassCard } from '@/components/ui/GlassCard';

export interface StatWidgetProps {
    /** Widget title */
    title: string;
    /** Main value to display */
    value: string | number;
    /** Optional subtext for context */
    subtext?: string;
    /** Icon component */
    icon: ReactNode;
    /** Icon background color classes */
    iconBg?: string;
    /** Trend direction */
    trend?: 'up' | 'down' | 'neutral';
    /** Trend percentage */
    trendValue?: string;
    /** Card variant */
    variant?: 'default' | 'blue' | 'green' | 'amber' | 'purple' | 'rose';
    /** Animation delay */
    delay?: number;
    /** Click handler for navigation */
    onClick?: () => void;
    /** Alert state (adds warning styling) */
    alert?: boolean;
    /** Test ID */
    testId?: string;
}

const TrendBadge = memo<{ trend: 'up' | 'down' | 'neutral'; value?: string }>(({ trend, value }) => {
    const config = {
        up: {
            icon: TrendingUp,
            bg: 'bg-green-100',
            text: 'text-green-700',
            defaultValue: '+2.4%'
        },
        down: {
            icon: TrendingDown,
            bg: 'bg-rose-100',
            text: 'text-rose-700',
            defaultValue: '-1.2%'
        },
        neutral: {
            icon: Minus,
            bg: 'bg-slate-100',
            text: 'text-slate-600',
            defaultValue: '0%'
        },
    };

    const { icon: Icon, bg, text, defaultValue } = config[trend];

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                bg, text
            )}
        >
            <Icon size={12} />
            {value || defaultValue}
        </motion.span>
    );
});

TrendBadge.displayName = 'TrendBadge';

export const StatWidget = memo<StatWidgetProps>(({
    title,
    value,
    subtext,
    icon,
    iconBg = 'bg-blue-100 text-blue-600',
    trend,
    trendValue,
    variant = 'default',
    delay = 0,
    onClick,
    alert = false,
    testId,
}) => {
    // Override variant if alert
    const effectiveVariant = alert ? 'amber' : variant;

    return (
        <GlassCard
            variant={effectiveVariant}
            delay={delay}
            onClick={onClick}
            testId={testId}
            className={cn(
                'p-5',
                alert && 'ring-2 ring-amber-300/50'
            )}
        >
            {/* Header row with icon and trend */}
            <div className="flex justify-between items-start mb-4">
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: delay + 0.1 }}
                    className={cn(
                        'p-2.5 rounded-xl shadow-sm',
                        iconBg
                    )}
                >
                    {icon}
                </motion.div>

                {trend && <TrendBadge trend={trend} value={trendValue} />}
            </div>

            {/* Content */}
            <div>
                <h3 className="text-slate-500 text-xs uppercase font-semibold tracking-wider mb-1">
                    {title}
                </h3>
                <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: delay + 0.15 }}
                    className={cn(
                        'text-2xl font-bold',
                        alert ? 'text-amber-900' : 'text-slate-900'
                    )}
                >
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </motion.p>

                {subtext && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: delay + 0.2 }}
                        className="text-slate-400 text-xs mt-1"
                    >
                        {subtext}
                    </motion.p>
                )}
            </div>
        </GlassCard>
    );
});

StatWidget.displayName = 'StatWidget';

export default StatWidget;
