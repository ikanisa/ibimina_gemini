import React, { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingsCardProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children?: ReactNode;
  action?: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  icon: Icon,
  children,
  action,
  onClick,
  variant = 'default',
  className = ''
}) => {
  const isClickable = !!onClick;
  const Component = isClickable ? 'button' : 'div';

  if (variant === 'compact') {
    return (
      <Component
        onClick={onClick}
        className={`w-full text-left bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-4 transition-all ${isClickable ? 'hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm cursor-pointer' : ''
          } ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-neutral-700 flex items-center justify-center text-slate-600 dark:text-neutral-400">
                <Icon size={20} />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{title}</h3>
              {description && (
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {isClickable && (
            <ChevronRight size={18} className="text-slate-400 dark:text-neutral-500" />
          )}
          {action}
        </div>
      </Component>
    );
  }

  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 overflow-hidden ${className}`}>
      <div className="p-5 border-b border-slate-100 dark:border-neutral-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Icon size={20} />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">{title}</h3>
              {description && (
                <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">{description}</p>
              )}
            </div>
          </div>
          {action}
        </div>
      </div>
      {children && (
        <div className="p-5">
          {children}
        </div>
      )}
    </div>
  );
};

export default SettingsCard;


