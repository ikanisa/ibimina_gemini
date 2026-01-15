/**
 * Breadcrumbs Component
 * Shows navigation path for deep pages
 */

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  if (items.length === 0) return null;

  return (
    <nav
      className={cn('flex items-center gap-2 text-sm text-slate-600', className)}
      aria-label="Breadcrumb"
    >
      <button
        onClick={items[0].onClick}
        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        aria-label="Home"
      >
        <Home size={16} />
      </button>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={16} className="text-slate-400" />
          {index === items.length - 1 ? (
            <span className="text-slate-900 font-medium">{item.label}</span>
          ) : (
            <button
              onClick={item.onClick}
              className="hover:text-blue-600 transition-colors"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
