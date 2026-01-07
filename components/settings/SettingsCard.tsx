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
        className={`w-full text-left bg-white rounded-xl border border-slate-200 p-4 transition-all ${
          isClickable ? 'hover:border-blue-300 hover:shadow-sm cursor-pointer' : ''
        } ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <Icon size={20} />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {isClickable && (
            <ChevronRight size={18} className="text-slate-400" />
          )}
          {action}
        </div>
      </Component>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Icon size={20} />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              {description && (
                <p className="text-sm text-slate-500 mt-1">{description}</p>
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

