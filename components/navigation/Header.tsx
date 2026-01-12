/**
 * Header Component
 * Top header bar with title, search, and user menu
 */

import React, { useState } from 'react';
import { Menu, Bell, Search, WifiOff, LogOut, UserCircle, KeyRound } from 'lucide-react';
import { ViewState } from '../../types';
import type { HeaderProps } from './types';
import { useIsMobile, useIsTabletOrLarger } from '../../hooks/useResponsive';

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentUser,
  isOffline,
  useMockData,
  isImpersonating,
  onNavigate,
  onSignOut,
  onMobileMenuToggle,
  onChangePassword,
}) => {
  const isMobile = useIsMobile();
  const isTabletOrLarger = useIsTabletOrLarger();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getViewTitle = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return `${currentUser.role} Dashboard`;
      case ViewState.GROUPS:
        return "Ibimina (Groups Management)";
      case ViewState.INSTITUTIONS:
        return 'Institutions Management';
      case ViewState.MEMBERS:
        return 'Member Management';
      case ViewState.TRANSACTIONS:
        return 'Transactions';
      case ViewState.REPORTS:
        return 'Reports & Analytics';
      case ViewState.STAFF:
        return 'Staff Administration';
      case ViewState.SETTINGS:
        return 'System Settings';
      case ViewState.PROFILE:
        return 'My Profile';
      default:
        return 'SACCO+';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-40 sticky top-0 backdrop-blur-sm bg-white/95">
      <div className="flex items-center gap-4">
        {isMobile && (
        <button
          className="text-slate-500 p-2 -ml-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all duration-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        )}
        <h2 className="text-base md:text-lg font-semibold text-slate-800 truncate">
          {getViewTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {isOffline && (
          <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
            <WifiOff size={14} /> Offline Mode
          </div>
        )}

        {/* System Health Indicator */}
        {!useMockData && (
          <div className="relative">
            {/* SystemHealthIndicator would go here */}
          </div>
        )}

        {isTabletOrLarger && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Global search..."
            className="pl-9 pr-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 xl:w-64 transition-all"
          />
        </div>
        )}
        <button
          className="relative text-slate-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-slate-100 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 outline-none"
          >
            <div
              className={`w-8 h-8 rounded-full overflow-hidden border border-slate-300 ${
                isImpersonating ? 'ring-2 ring-orange-500' : ''
              }`}
            >
              <img src={currentUser.avatarUrl} alt={currentUser.name} />
            </div>
          </button>

          {isProfileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsProfileMenuOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.role}</p>
                </div>
                <button
                  onClick={() => {
                    onNavigate(ViewState.PROFILE);
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <UserCircle size={16} /> My Profile
                </button>
                <button
                  onClick={() => {
                    onChangePassword?.();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <KeyRound size={16} /> Change Password
                </button>
                <button
                  onClick={onSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
