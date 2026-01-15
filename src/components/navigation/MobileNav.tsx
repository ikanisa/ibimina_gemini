/**
 * Mobile Bottom Navigation Component
 * Provides touch-friendly navigation for mobile devices
 */

import React from 'react';
import {
    LayoutDashboard,
    Users,
    Receipt,
    FolderOpen,
    Settings,
    HandCoins,
    LucideIcon
} from 'lucide-react';
import { ViewState } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
    id: ViewState;
    label: string;
    icon: LucideIcon;
}

interface MobileNavProps {
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    className?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const navItems: NavItem[] = [
    { id: ViewState.DASHBOARD, label: 'Home', icon: LayoutDashboard },
    { id: ViewState.GROUPS, label: 'Groups', icon: FolderOpen },
    { id: ViewState.TRANSACTIONS, label: 'Transactions', icon: Receipt },
    { id: ViewState.LOANS, label: 'Loans', icon: HandCoins },
    { id: ViewState.MEMBERS, label: 'Members', icon: Users },
    { id: ViewState.SETTINGS, label: 'Settings', icon: Settings },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const MobileNav: React.FC<MobileNavProps> = ({
    currentView,
    onNavigate,
    className = '',
}) => {
    return (
        <nav
            className={`
        fixed bottom-0 left-0 right-0
        bg-white border-t border-slate-200
        px-2 pb-safe
        md:hidden
        z-20
        ${className}
      `}
            aria-label="Mobile navigation"
        >
            <div className="flex items-center justify-around">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`
                flex flex-col items-center justify-center
                py-2 px-3 min-w-[64px]
                transition-colors duration-200
                ${isActive
                                    ? 'text-blue-600'
                                    : 'text-slate-500 hover:text-slate-700'
                                }
              `}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className={`
                p-1.5 rounded-lg transition-colors duration-200
                ${isActive ? 'bg-blue-50' : ''}
              `}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`
                text-xs mt-1 font-medium
                ${isActive ? 'text-blue-600' : 'text-slate-500'}
              `}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

// ============================================================================
// MOBILE NAV SPACER
// Add this below your main content to account for nav height
// ============================================================================

export const MobileNavSpacer: React.FC = () => (
    <div className="h-20 md:hidden" aria-hidden="true" />
);

export default MobileNav;
