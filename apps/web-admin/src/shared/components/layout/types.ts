/**
 * Types for Layout module components
 */

import type { ViewState } from '@/core/types';

export interface NavigationItemProps {
    view: ViewState;
    icon: React.ReactNode;
    label: string;
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    onMobileMenuClose: () => void;
    canAccess: boolean;
}

export interface SidebarProps {
    currentUser: {
        name: string;
        role: string;
        avatarUrl: string;
    };
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    onMobileMenuClose: () => void;
    canAccess: (view: ViewState) => boolean;
    originalUser: any;
    isImpersonating: boolean;
    onSignOut: () => void;
    isMobileMenuOpen: boolean;
}

export interface HeaderProps {
    currentView: ViewState;
    currentUser: {
        name: string;
        role: string;
        avatarUrl: string;
    };
    isOffline: boolean;
    isImpersonating: boolean;
    onNavigate: (view: ViewState) => void;
    onSignOut: () => void;
    onMobileMenuToggle: () => void;
    isMobileMenuOpen: boolean;
    onChangePassword?: () => void;
}
