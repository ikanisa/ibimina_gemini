/**
 * Reusable Empty State Component
 * 
 * Provides consistent empty state UI across the application with
 * icon, title, description, and optional action button.
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  /** Icon to display (from lucide-react) */
  icon?: LucideIcon;
  /** Main title text */
  title: string;
  /** Supporting description text */
  description?: string;
  /** Action button or link */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Icon size (default: 48) */
  iconSize?: number;
  /** Compact variant with less padding */
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  iconSize = 48,
  compact = false
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'p-6' : 'p-12'
      } ${className}`}>
      {Icon && (
        <div className={`mb-4 ${compact ? 'p-3' : 'p-4'} bg-slate-100 rounded-full`}>
          <Icon size={compact ? 36 : iconSize} className="text-slate-400" strokeWidth={1.5} />
        </div>
      )}
      <h3 className={`font-semibold text-slate-900 mb-2 ${compact ? 'text-base' : 'text-lg'}`}>
        {title}
      </h3>
      {description && (
        <p className={`text-slate-500 max-w-md ${compact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
