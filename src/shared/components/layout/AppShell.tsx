import React, { useState, ReactNode } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { Header } from '@/components/navigation/Header';
import { SessionWarningModal } from '@/hooks/useSessionTimeout';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { SkipLink } from '@/shared/components/ui';
import { StaffMember, ViewState } from '@/core/types';
import { Eye } from 'lucide-react';

interface AppShellProps {
    children: ReactNode;
    currentUser: StaffMember;
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    canAccess: (view: ViewState) => boolean;
    onSignOut: () => void;
    isImpersonating: boolean;
    baseUser: StaffMember | null;
    onStopImpersonating: () => void;
    onStartImpersonating: (staff: StaffMember) => void;
    isOffline: boolean;
    sessionTimeout: any; // Using explicit type locally or Import specific type if available
}

export const AppShell: React.FC<AppShellProps> = ({
    children,
    currentUser,
    currentView,
    onNavigate,
    canAccess,
    onSignOut,
    isImpersonating,
    baseUser,
    onStopImpersonating,
    onStartImpersonating,
    isOffline,
    sessionTimeout,
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    return (
        <>
            <SkipLink targetId="main-content" />
            <OfflineIndicator position="top" />
            <div className="flex h-screen bg-slate-50 dark:bg-neutral-900 overflow-hidden font-inter">
                {/* Sidebar */}
                <Sidebar
                    currentUser={currentUser}
                    currentView={currentView}
                    onNavigate={onNavigate}
                    onMobileMenuClose={() => setIsMobileMenuOpen(false)}
                    canAccess={canAccess}
                    originalUser={baseUser}
                    isImpersonating={isImpersonating}
                    onSignOut={onSignOut}
                    isMobileMenuOpen={isMobileMenuOpen}
                    onRoleSwitch={onStartImpersonating}
                    onRoleReset={onStopImpersonating}
                />

                {/* Main Content */}
                <main id="main-content" className="flex-1 flex flex-col h-screen overflow-hidden relative" tabIndex={-1}>
                    {isImpersonating && (
                        <div className="bg-orange-600 text-white px-4 py-2 text-sm flex items-center justify-between shadow-md z-50">
                            <div className="flex items-center gap-2">
                                <Eye size={16} />
                                <span>
                                    You are viewing the portal as <strong>{currentUser.name}</strong> ({currentUser.role}).
                                </span>
                            </div>
                            <button
                                onClick={onStopImpersonating}
                                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                            >
                                Exit View
                            </button>
                        </div>
                    )}

                    {/* Header */}
                    <Header
                        currentView={currentView}
                        currentUser={currentUser}
                        isOffline={isOffline}
                        isImpersonating={isImpersonating}
                        onNavigate={onNavigate}
                        onSignOut={onSignOut}
                        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        isMobileMenuOpen={isMobileMenuOpen}
                        onChangePassword={() => setIsChangePasswordOpen(true)}
                    />

                    {/* View Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth pb-20 md:pb-6 relative z-0">
                        {children}
                    </div>

                    {/* Mobile Bottom Nav */}
                    <div className="md:hidden z-50">
                        <MobileBottomNav
                            currentView={currentView}
                            onNavigate={onNavigate}
                            canAccess={canAccess}
                            onMenuToggle={() => setIsMobileMenuOpen(true)}
                        />
                    </div>

                    {isMobileMenuOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        ></div>
                    )}
                </main>

                {/* Modals */}
                <SessionWarningModal
                    isOpen={sessionTimeout.isWarning}
                    remainingSeconds={sessionTimeout.remainingSeconds}
                    timeoutType={sessionTimeout.timeoutType}
                    onExtend={sessionTimeout.extendSession}
                    onLogout={sessionTimeout.logout}
                />

                <ChangePasswordModal
                    isOpen={isChangePasswordOpen}
                    onClose={() => setIsChangePasswordOpen(false)}
                />
            </div>
        </>
    );
};
