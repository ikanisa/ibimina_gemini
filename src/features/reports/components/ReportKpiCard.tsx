import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReportKpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const ReportKpiCard = memo<ReportKpiCardProps>(({
  label,
  value,
  subValue,
  trend,
  icon,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-200',
    success: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200'
  };

  const valueColors = {
    default: 'text-slate-900',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-red-700'
  };

  return (
    <div className={`rounded-xl border p-4 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className={`text-2xl font-bold ${valueColors[variant]}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue && (
            <p className="text-xs text-slate-500 mt-1">{subValue}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {icon && (
            <div className="text-slate-400">{icon}</div>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' :
              trend === 'down' ? 'text-red-600' :
                'text-slate-400'
              }`}>
              {trend === 'up' && <TrendingUp size={14} />}
              {trend === 'down' && <TrendingDown size={14} />}
              {trend === 'neutral' && <Minus size={14} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

