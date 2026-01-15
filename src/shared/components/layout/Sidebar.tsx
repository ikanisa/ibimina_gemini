/**
 * Sidebar Component
 * Main navigation sidebar
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  Building,
  ShieldCheck,
  Briefcase,
  PieChart,
  LogOut,
  ChevronDown,
  Smartphone,
} from 'lucide-react';
import { ViewState } from '@/core/types';
import { NavigationItem } from './NavigationItem';
// Mock data removed - using only real Supabase data
import type { SidebarProps } from './types';

interface SidebarPropsWithRoleSwitch extends SidebarProps {
  onRoleSwitch?: (staff: any) => void;
  onRoleReset?: () => void;
}

export const Sidebar: React.FC<SidebarPropsWithRoleSwitch> = ({
  currentUser,
  currentView,
  onNavigate,
  onMobileMenuClose,
  canAccess,
  // useMockData removed
  originalUser,
  isImpersonating,
  onSignOut,
  isMobileMenuOpen,
  onRoleSwitch,
  onRoleReset,
}) => {
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);

  // RoleSwitcher removed - was only for mock data
  const RoleSwitcher = () => null;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col shadow-xl md:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">
          S+
        </div>
        <h1 className="text-xl font-bold tracking-tight">SACCO+</h1>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-4 flex items-center gap-3">
          <img
            src={currentUser.avatarUrl}
            className="w-8 h-8 rounded-full bg-slate-700"
            alt=""
          />
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
          </div>
        </div>

        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">
          Core
        </p>
        <NavigationItem
          view={ViewState.DASHBOARD}
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          currentView={currentView}
          onNavigate={onNavigate}
          onMobileMenuClose={onMobileMenuClose}
          canAccess={canAccess(ViewState.DASHBOARD)}
        />
        <NavigationItem
          view={ViewState.GROUPS}
          icon={<Briefcase size={18} />}
          label="Groups (Ibimina)"
          currentView={currentView}
          onNavigate={onNavigate}
          onMobileMenuClose={onMobileMenuClose}
          canAccess={canAccess(ViewState.GROUPS)}
        />
        <NavigationItem
          view={ViewState.MEMBERS}
          icon={<Users size={18} />}
          label="Members"
          currentView={currentView}
          onNavigate={onNavigate}
          onMobileMenuClose={onMobileMenuClose}
          canAccess={canAccess(ViewState.MEMBERS)}
        />

        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">
          Finance
        </p>
        <NavigationItem
          view={ViewState.TRANSACTIONS}
          icon={<CreditCard size={18} />}
          label="Transactions"
          currentView={currentView}
          onNavigate={onNavigate}
          onMobileMenuClose={onMobileMenuClose}
          canAccess={canAccess(ViewState.TRANSACTIONS)}
        />
        <NavigationItem
          view={ViewState.LOANS}
          icon={<Briefcase size={18} />}
          label="Loans"
          currentView={currentView}
          onNavigate={onNavigate}
          onMobileMenuClose={onMobileMenuClose}
          canAccess={canAccess(ViewState.LOANS)}
        />
        <NavigationItem
          view={ViewState.REPORTS}
          icon={<PieChart size={18} />}
          label="Reports"
          currentView={currentView}
          onNavigate={onNavigate}
          onMobileMenuClose={onMobileMenuClose}
          canAccess={canAccess(ViewState.REPORTS)}
        />

        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">
          System
        </p>
        <NavigationItem
          view={ViewState.INSTITUTIONS}
          icon={<Building size={18} />}
          label="Institutions"
          currentView={currentView}
          onNavigate={onNavigate}
          onMobileMenuClose={onMobileMenuClose}
          canAccess={canAccess(ViewState.INSTITUTIONS)}
        />
        <NavigationItem
          view={ViewState.STAFF}
          icon={<ShieldCheck size={18} />}
          label="Staff & Roles"
          currentView={currentView}
          onNavigate={onNavigate}
          onMobileMenuClose={onMobileMenuClose}
          canAccess={canAccess(ViewState.STAFF)}
        />
        <NavigationItem
          view={ViewState.SMS_GATEWAY_DEVICES}
          icon={<Smartphone size={18} />}
          label="SMS Gateway Devices"
          currentView={currentView}
          onNavigate={onNavigate}
          onMobileMenuClose={onMobileMenuClose}
          canAccess={canAccess(ViewState.SMS_GATEWAY_DEVICES)}
        />
        <NavigationItem
          view={ViewState.SETTINGS}
          icon={<Settings size={18} />}
          label="Settings"
          currentView={currentView}
          onNavigate={onNavigate}
          onMobileMenuClose={onMobileMenuClose}
          canAccess={canAccess(ViewState.SETTINGS)}
        />
      </nav>

      <RoleSwitcher />

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 text-slate-400 hover:text-white text-sm w-full px-4 py-2 rounded hover:bg-slate-800 transition-colors"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );
};
