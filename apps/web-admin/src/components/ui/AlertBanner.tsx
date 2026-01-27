/**
 * AlertBanner Component
 * 
 * A consistent, dismissible banner for displaying warnings, info messages,
 * and errors with optional action buttons. Replaces ad-hoc alert patterns.
 */

import React, { useState } from 'react';
import { AlertCircle, Info, CheckCircle2, AlertTriangle, X, LucideIcon } from 'lucide-react';
import { Button } from './Button';

type AlertVariant = 'info' | 'warning' | 'error' | 'success';

export interface AlertBannerProps {
    /** Alert variant determines colors and icon */
    variant?: AlertVariant;
    /** Main message text */
    message: string;
    /** Optional description below the message */
    description?: string;
    /** Allow user to dismiss the banner */
    dismissible?: boolean;
    /** Callback when dismissed */
    onDismiss?: () => void;
    /** Primary action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Custom icon override */
    icon?: LucideIcon;
    /** Additional CSS classes */
    className?: string;
}

const variantConfig: Record<AlertVariant, {
    bg: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    icon: LucideIcon;
    iconBg: string;
    actionBg: string;
    actionHover: string;
}> = {
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        textPrimary: 'text-blue-800',
        textSecondary: 'text-blue-600',
        icon: Info,
        iconBg: 'bg-blue-100 text-blue-600',
        actionBg: 'bg-blue-100 text-blue-700',
        actionHover: 'hover:bg-blue-200',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textPrimary: 'text-amber-800',
        textSecondary: 'text-amber-600',
        icon: AlertTriangle,
        iconBg: 'bg-amber-100 text-amber-600',
        actionBg: 'bg-amber-100 text-amber-700',
        actionHover: 'hover:bg-amber-200',
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        textPrimary: 'text-red-800',
        textSecondary: 'text-red-600',
        icon: AlertCircle,
        iconBg: 'bg-red-100 text-red-600',
        actionBg: 'bg-red-100 text-red-700',
        actionHover: 'hover:bg-red-200',
    },
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        textPrimary: 'text-green-800',
        textSecondary: 'text-green-600',
        icon: CheckCircle2,
        iconBg: 'bg-green-100 text-green-600',
        actionBg: 'bg-green-100 text-green-700',
        actionHover: 'hover:bg-green-200',
    },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
    variant = 'info',
    message,
    description,
    dismissible = false,
    onDismiss,
    action,
    icon: CustomIcon,
    className = '',
}) => {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const config = variantConfig[variant];
    const Icon = CustomIcon || config.icon;

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    return (
        <div
            className={`flex items-center justify-between p-4 ${config.bg} border ${config.border} rounded-xl ${className}`}
            role="alert"
        >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.iconBg}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <p className={`text-sm font-medium ${config.textPrimary}`}>{message}</p>
                    {description && (
                        <p className={`text-xs ${config.textSecondary} mt-0.5`}>{description}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {action && (
                    <button
                        onClick={action.onClick}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${config.actionBg} ${config.actionHover}`}
                    >
                        {action.label}
                    </button>
                )}
                {dismissible && (
                    <button
                        onClick={handleDismiss}
                        className={`p-1 rounded-lg ${config.textSecondary} hover:${config.textPrimary} transition-colors`}
                        aria-label="Dismiss"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default AlertBanner;
