/**
 * MobileBottomNav Component
 * Bottom navigation for mobile devices
 */

import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CreditCard,
  PieChart,
} from 'lucide-react';
import { ViewState } from '@/core/types';
import { cn } from '@/lib/utils/cn';
import { useIsMobile } from '@/shared/hooks/useResponsive';

interface MobileBottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  canAccess: (view: ViewState) => boolean;
}

const navItems = [
  {
    view: ViewState.DASHBOARD,
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    view: ViewState.GROUPS,
    icon: Briefcase,
    label: 'Groups',
  },
  {
    view: ViewState.MEMBERS,
    icon: Users,
    label: 'Members',
  },
  {
    view: ViewState.TRANSACTIONS,
    icon: CreditCard,
    label: 'Transactions',
  },
  {
    view: ViewState.REPORTS,
    icon: PieChart,
    label: 'Reports',
  },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  canAccess,
}) => {
  const isMobile = useIsMobile();
  const visibleItems = navItems.filter((item) => canAccess(item.view));

  if (visibleItems.length === 0 || !isMobile) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-5 h-16">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;

          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors touch-manipulation',
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
