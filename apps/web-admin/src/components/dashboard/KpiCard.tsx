import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

type CardVariant = 'default' | 'primary';
type CardColor = 'blue' | 'green' | 'indigo' | 'amber' | 'purple' | 'slate';

interface KpiCardProps {
  /** Card title/label */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional subtext below value */
  subtext?: string;
  /** Icon to display */
  icon: LucideIcon;
  /** Icon color scheme */
  iconColor?: CardColor;
  /** Card variant - 'primary' for blue gradient, 'default' for white */
  variant?: CardVariant;
  /** Trend indicator */
  trend?: 'up' | 'down' | 'neutral';
  /** Show alert styling */
  alert?: boolean;
  /** Additional CSS classes  */
  className?: string;
}

const colorClasses: Record<CardColor, { bg: string; text: string; gradient: string }> = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600 shadow-blue-500/30'
  },
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    gradient: 'from-emerald-500 to-green-600 shadow-green-500/30'
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    gradient: 'from-indigo-500 to-purple-600 shadow-indigo-500/30'
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-600 shadow-amber-500/30'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    gradient: 'from-purple-500 to-violet-600 shadow-purple-500/30'
  },
  slate: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    gradient: 'from-slate-500 to-slate-600 shadow-slate-500/30'
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'blue',
  variant = 'default',
  trend,
  alert,
  className = ''
}) => {
  const colors = colorClasses[iconColor];

  // Primary variant: blue gradient card with white text
  if (variant === 'primary') {
    return (
      <div className={`bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 ${className}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 rounded-lg bg-white/20 backdrop-blur-sm">
            <Icon size={22} className="text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-300' : trend === 'down' ? 'text-red-300' : 'text-white/60'
              }`}>
              {trend === 'up' && <TrendingUp size={14} />}
              {trend === 'down' && <TrendingDown size={14} />}
            </div>
          )}
        </div>
        <p className="text-white/80 text-xs uppercase font-semibold tracking-wider mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {subtext && (
          <p className="text-sm text-white/70 mt-1">{subtext}</p>
        )}
      </div>
    );
  }

  // Default variant: white card with colored icon
  return (
    <div className={`bg-white p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${alert ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
      } ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colors.bg} ${colors.text}`}>
          <Icon size={22} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${trend === 'up' ? 'text-green-600 bg-green-50' :
              trend === 'down' ? 'text-red-500 bg-red-50' :
                'text-slate-400 bg-slate-50'
            }`}>
            {trend === 'up' && <TrendingUp size={14} />}
            {trend === 'down' && <TrendingDown size={14} />}
          </div>
        )}
      </div>
      <p className={`text-2xl md:text-3xl font-bold ${alert ? 'text-amber-700' : 'text-slate-900'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-slate-500 mt-1">{title}</p>
      {subtext && (
        <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>
      )}
    </div>
  );
};

export default KpiCard;

