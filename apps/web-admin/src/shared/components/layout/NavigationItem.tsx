/**
 * NavigationItem Component
 * Individual navigation item in sidebar
 */

import React from 'react';
import { ViewState } from '@/core/types';
import type { NavigationItemProps } from './types';

export const NavigationItem: React.FC<NavigationItemProps> = ({
  view,
  icon,
  label,
  currentView,
  onNavigate,
  onMobileMenuClose,
  canAccess,
}) => {
  if (!canAccess) return null;

  return (
    <button
      onClick={() => {
        onNavigate(view);
        onMobileMenuClose();
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mb-1 min-h-[44px] touch-manipulation ${
        currentView === view
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-[1.02]'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white active:scale-[0.98]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};
