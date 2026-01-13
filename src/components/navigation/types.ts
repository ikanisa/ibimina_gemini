/**
 * Types for Navigation module components
 */

import { ViewState } from '../../types';

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
  // useMockData removed - application now uses only real Supabase data
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
  // useMockData removed - application now uses only real Supabase data
  isImpersonating: boolean;
  onNavigate: (view: ViewState) => void;
  onSignOut: () => void;
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}
