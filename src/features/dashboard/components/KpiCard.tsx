import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  alert?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  trend,
  alert
}) => {
  return (
    <div className={`bg-white dark:bg-neutral-800 p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${alert ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/20' : 'border-slate-200 dark:border-neutral-700'
      }`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor}`}>
          <Icon size={22} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-neutral-500'
            }`}>
            {trend === 'up' && <TrendingUp size={14} />}
            {trend === 'down' && <TrendingDown size={14} />}
          </div>
        )}
      </div>
      <p className={`text-2xl md:text-3xl font-bold ${alert ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-neutral-100'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">{title}</p>
      {subtext && (
        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{subtext}</p>
      )}
    </div>
  );
};

export default KpiCard;


