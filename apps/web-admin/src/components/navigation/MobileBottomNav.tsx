/**
 * MobileBottomNav Component
 * Bottom navigation for mobile devices
 */

import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  CreditCard,
  Menu,
} from 'lucide-react';
import { ViewState } from '../../types';
import { cn } from '../../lib/utils/cn';
import { useIsMobile } from '../../hooks/useResponsive';

interface MobileBottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  canAccess: (view: ViewState) => boolean;
  onMenuToggle: () => void;
}

const navItems = [
  {
    id: 'home',
    view: ViewState.DASHBOARD,
    icon: LayoutDashboard,
    label: 'Home',
  },
  {
    id: 'ledger',
    view: ViewState.TRANSACTIONS,
    icon: CreditCard,
    label: 'Ledger',
  },
  {
    id: 'directory',
    view: ViewState.GROUPS,
    icon: Briefcase,
    label: 'Directory',
  },
  {
    id: 'menu',
    icon: Menu,
    label: 'Menu',
    isAction: true,
  },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  canAccess,
  onMenuToggle,
}) => {
  const isMobile = useIsMobile();

  // Filter items: 
  // - View-based items check canAccess
  // - Action-based items (Menu) result is always visible
  const visibleItems = navItems.filter((item) => {
    if (item.isAction) return true;
    return item.view && canAccess(item.view);
  });

  if (visibleItems.length === 0 || !isMobile) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-slate-200 pb-safe"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-4 h-16">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = !item.isAction && item.view === currentView;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isAction) {
                  onMenuToggle();
                } else if (item.view) {
                  onNavigate(item.view);
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors touch-manipulation relative',
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <div className="absolute top-0 h-0.5 w-8 bg-blue-600 rounded-full" />
              )}
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
