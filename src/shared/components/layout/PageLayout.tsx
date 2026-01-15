/**
 * PageLayout Component
 * Standard page wrapper with title, description, and action buttons
 */

import React from 'react';
import { cn } from '../../lib/utils/cn';
import { spacing } from '../../lib/design-tokens';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = React.memo(({
  children,
  title,
  description,
  actions,
  className,
}) => {
  return (
    <div className={cn('space-y-6', className)} style={{ padding: spacing.lg }}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            )}
            {description && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
});
