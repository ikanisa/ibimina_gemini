/**
 * StatusIndicator Component
 * Displays status with icon and label using consistent styling
 */

import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export type Status = 'active' | 'pending' | 'inactive' | 'error' | 'warning';

interface StatusIndicatorProps {
  status: Status;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  active: {
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
  },
  pending: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Clock,
  },
  inactive: {
    color: 'text-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: XCircle,
  },
  error: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle,
  },
  warning: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertCircle,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.color,
        config.bg,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />}
      {label || status}
    </span>
  );
};
