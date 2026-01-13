/**
 * App Component (Refactored)
 * Main application container with navigation
 * Uses modular navigation components
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import { Eye, WifiOff } from 'lucide-react';
// Mock data removed - using only real Supabase data
import { ViewState, StaffRole, StaffMember, KpiStats, SupabaseProfile } from './types';
import { useAuth } from './contexts/AuthContext';
import { buildInitialsAvatar } from './lib/avatars';
import { Sidebar, Header, MobileBottomNav } from './components/navigation';
import { AnimatedPage } from './components/ui/AnimatedPage';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { useSessionTimeout, SessionWarningModal } from './hooks/useSessionTimeout';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SkipLink } from './components/ui/SkipLink';

const Dashboard = lazy(() => import('./components/Dashboard'));
const MinimalistDashboard = lazy(() => import('./components/MinimalistDashboard'));
const Groups = lazy(() => import('./components/Groups'));
const Members = lazy(() => import('./components/Members'));
const Transactions = lazy(() => import('./components/Transactions'));
const Institutions = lazy(() => import('./components/institutions/Institutions'));
const Reports = lazy(() => import('./components/Reports'));
const Staff = lazy(() => import('./components/Staff'));
const Profile = lazy(() => import('./components/Profile'));
const SettingsPage = lazy(() => import('./components/Settings'));
const SmsGatewayDevices = lazy(() => import('./components/sms-gateway/SmsGatewayDevices'));
const Login = lazy(() => import('./components/Login'));
const ChangePasswordModal = lazy(() => import('./components/ChangePasswordModal'));
const AppBoot = lazy(() => import('./components/AppBoot'));
const SystemHealthIndicator = lazy(() => import('./components/SystemHealthIndicator'));

// Production guard: Fail loudly if mock data is enabled in production
// This is a critical security issue as it bypasses authentication
// This check is now handled in the App component itself

const EMPTY_STATS: KpiStats = {
  totalMembers: 0,
  activeMembers: 0,
  activeGroups: 0,
  totalGroupFunds: 0,
  totalSavings: 0,
  outstandingLoans: 0,
  tokenSupply: 0,
  dailyDeposits: 0,
  reconciliationStatus: 'Pending',
};

const mapUserToStaffMember = (
  user: User,
  role: StaffRole | null,
  profile: SupabaseProfile | null
): StaffMember => {
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const profileName = typeof profile?.full_name === 'string' ? profile.full_name : null;
  const profileBranch = typeof profile?.branch === 'string' ? profile.branch : null;
  const profileAvatar = typeof profile?.avatar_url === 'string' ? profile.avatar_url : null;
  const profileEmail = typeof profile?.email === 'string' ? profile.email : null;
  const name =
    (profileName && profileName.trim()) ||
    (typeof metadata?.full_name === 'string' && metadata.full_name) ||
    (typeof metadata?.name === 'string' && metadata.name) ||
    user.email ||
    'Staff';
  const email = profileEmail || user.email || 'unknown';
  const branch = (profileBranch && profileBranch.trim()) || (typeof metadata?.branch === 'string' && metadata.branch) || 'HQ';
  const avatarUrl =
    profileAvatar ||
    (typeof metadata?.avatar_url === 'string' && metadata.avatar_url) ||
    buildInitialsAvatar(name);
  const lastLoginSource = profile?.last_login_at ?? user.last_sign_in_at ?? null;
  const lastLogin = lastLoginSource ? new Date(lastLoginSource).toLocaleString() : '—';
  const status = profile?.status === 'SUSPENDED' ? 'Suspended' : 'Active';

  return {
    id: user.id,
    name,
    email,
    role: role ?? 'Staff',
    branch,
    status,
    lastLogin,
    avatarUrl,
  };
};

const LoadingScreen: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowHelp(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
        <p className="text-sm font-medium">Loading session...</p>
        {showHelp && (
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-800 underline underline-offset-2"
          >
            Stuck loading? Reload
          </button>
        )}
      </div>
    </div>
  );
};

import {
  DashboardSkeleton,
  TransactionsSkeleton,
  MembersSkeleton,
  GroupsSkeleton,
  ReportsSkeleton
} from './components/ui/PageSkeletons';

// Map view names to skeleton components
const SKELETONS: Partial<Record<string, React.FC>> = {
  dashboard: DashboardSkeleton,
  transactions: TransactionsSkeleton,
  members: MembersSkeleton,
  groups: GroupsSkeleton,
  reports: ReportsSkeleton,
};

const SectionLoading: React.FC = () => {
  // Try to infer current section from URL or state if possible, default to spinner
  // For now, since we're inside RouteErrorBoundary which is inside a specific route, we might not know.
  // But actually, we are using Suspense around specific components in App.tsx.
  // We can make SectionLoading accept a type prop, but Suspense doesn't pass props.
  // However, we can use specific fallbacks at the usage site.

  return (
    <div className="flex items-center justify-center p-8 animate-in fade-in duration-200">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex space-x-4 mb-8">
          <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse"></div>
          <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const MissingConfig: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-lg w-full text-center space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Supabase configuration required</h1>
      <p className="text-sm text-slate-600">
        Set <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
        <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> in{' '}
        <span className="font-mono">.env.local</span> to continue.
      </p>
      <div className="text-left text-xs bg-slate-100 border border-slate-200 rounded-lg p-3 font-mono text-slate-600">
        VITE_SUPABASE_URL=https://your-project.supabase.co<br />
        VITE_SUPABASE_ANON_KEY=your-anon-key
      </div>
    </div>
  </div>
);

const InitError: React.FC<{ error: string }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-8 max-w-lg w-full text-center space-y-4">
      <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
        <WifiOff size={24} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Connection Error</h1>
      <p className="text-slate-600">
        We couldn't connect to the server. This might be a network issue or a configuration problem.
      </p>
      <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm font-mono text-left overflow-auto max-h-32">
        {error}
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
      >
        Retry Connection
      </button>
    </div>
  </div>
);

const AccountNotProvisioned: React.FC<{ email?: string; userId: string }> = ({ email, userId }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-lg w-full text-center space-y-4">
      <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4">
        <Eye size={24} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Account Setup Required</h1>
      <p className="text-slate-600">
        You are signed in, but your account hasn't been linked to an institution yet.
      </p>
      <div className="bg-slate-50 p-4 rounded-lg text-sm text-left space-y-2 border border-slate-200">
        <p>
          <span className="font-semibold text-slate-500">Email:</span> {email}
        </p>
        <p>
          <span className="font-semibold text-slate-500">User ID:</span>{' '}
          <span className="font-mono text-xs">{userId}</span>
        </p>
      </div>
      <p className="text-sm text-slate-500">
        Please contact your administrator to create your staff profile and link it to an institution.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
      >
        Check Again
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const { user, profile, role, institutionId, loading, signOut, isConfigured, error } = useAuth();

  // Session timeout: 30 min idle, 8 hour absolute
  const sessionTimeout = useSessionTimeout({
    idleTimeoutMinutes: 30,
    absoluteTimeoutHours: 8,
    enabled: !!user, // Only enable when user is logged in
    onTimeout: () => {
      console.log('Session timeout triggered');
    },
  });

  // Production guard: Fail loudly if mock data is enabled
  if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK_DATA === 'true') {
    throw new Error(
      '🚨 CRITICAL SECURITY ERROR: VITE_USE_MOCK_DATA=true in production build!\n' +
      'This bypasses authentication and allows unauthorized access.\n' +
      'The portal should ONLY be accessible to invited staff members.\n' +
      'Please remove VITE_USE_MOCK_DATA from production environment variables.'
    );
  }

  const baseUser = user ? mapUserToStaffMember(user, role, profile) : null;
  const [viewingAsUser, setViewingAsUser] = useState<StaffMember | null>(null);

  const currentUser = viewingAsUser || baseUser;
  const isImpersonating = Boolean(viewingAsUser);

  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleSignOut = async () => {
    setViewingAsUser(null);
    await signOut();
  };

  const dashboardStats = EMPTY_STATS;
  const dashboardTransactions: Transaction[] = [];
  const showMinimalistDashboard = true;

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setViewingAsUser(null);
  }, [baseUser?.id]);

  useEffect(() => {
    if (currentUser) {
      setCurrentView(ViewState.DASHBOARD);
    }
  }, [currentUser?.id]);

  // Check configuration and authentication
  if (!isConfigured) {
    return <MissingConfig />;
  }
  if (loading) {
    return <LoadingScreen />;
  }
  if (error) {
    return <InitError error={error} />;
  }
  if (!user || !baseUser) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Login />
      </Suspense>
    );
  }

  // SECURITY: If user is logged in but has no profile/institution and is NOT a platform admin, they need provisioning
  // This ensures only invited staff (with profiles) can access the portal
  const isPlatformAdmin = role === 'Admin' || role?.toUpperCase() === 'ADMIN';
  const hasValidAccess = isPlatformAdmin || (institutionId && profile);

  if (!hasValidAccess) {
    // User is authenticated but doesn't have a profile - they weren't invited as staff
    console.warn('[Security] Authenticated user without profile/institution access:', {
      userId: user.id,
      email: user.email,
      hasProfile: !!profile,
      institutionId,
      role
    });

    return (
      <div className="flex flex-col h-screen">
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <WifiOff size={16} /> Sign Out
          </button>
        </div>
        <AccountNotProvisioned email={user.email} userId={user.id} />
      </div>
    );
  }

  if (!currentUser) {
    return <LoadingScreen />;
  }

  // RBAC Permission Map
  const canAccess = (view: ViewState): boolean => {
    const effectiveRole = role;
    if (!effectiveRole) return false;

    const roleUpper = effectiveRole.toUpperCase();
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'PLATFORM_ADMIN' || roleUpper === 'INSTITUTION_ADMIN';
    const isStaff = roleUpper === 'STAFF' || roleUpper === 'INSTITUTION_STAFF';

    // Admin has unrestricted access to everything
    if (isAdmin) {
      return true;
    }

    switch (view) {
      // Everyone can access these
      case ViewState.DASHBOARD:
      case ViewState.GROUPS:
      case ViewState.PROFILE:
      case ViewState.MEMBERS:
      case ViewState.TRANSACTIONS:
        return true;

      // Admin-only views (Admin already returned true above)
      case ViewState.INSTITUTIONS:
      case ViewState.STAFF:
      case ViewState.SETTINGS:
      case ViewState.SMS_GATEWAY_DEVICES:
        return false; // Only Admin

      // Staff can view reports
      case ViewState.REPORTS:
        return isStaff || isAdmin;

      default:
        return false;
    }
  };

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AppBoot>
        <SkipLink targetId="main-content" />
        <OfflineIndicator position="top" />
        <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
          {/* Sidebar */}
          <Sidebar
            currentUser={currentUser}
            currentView={currentView}
            onNavigate={setCurrentView}
            onMobileMenuClose={() => setIsMobileMenuOpen(false)}
            canAccess={canAccess}
            originalUser={baseUser}
            isImpersonating={isImpersonating}
            onSignOut={handleSignOut}
            isMobileMenuOpen={isMobileMenuOpen}
            onRoleSwitch={(staff) => setViewingAsUser(staff)}
            onRoleReset={() => setViewingAsUser(null)}
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
                  onClick={() => setViewingAsUser(null)}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                >
                  Exit View
                </button>
              </div>
            )}

            {/* Demo mode banner */}
            {false && (
              <div
                className={`px-4 py-2 text-xs font-medium flex items-center justify-between ${import.meta.env.PROD
                  ? 'bg-red-600 text-white'
                  : 'bg-amber-100 text-amber-800'
                  }`}
              >
                <span>
                  {import.meta.env.PROD
                    ? '⚠️ DANGER: Mock data mode in production! Authentication is bypassed.'
                    : 'Demo mode enabled: showing mock data and roles.'}
                </span>
              </div>
            )}

            {/* Header */}
            <Header
              currentView={currentView}
              currentUser={currentUser}
              isOffline={isOffline}
              isImpersonating={isImpersonating}
              onNavigate={setCurrentView}
              onSignOut={handleSignOut}
              onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              isMobileMenuOpen={isMobileMenuOpen}
              onChangePassword={() => setIsChangePasswordOpen(true)}
            />

            {/* View Area with Page Transitions */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth pb-20 md:pb-6">
              <RouteErrorBoundary routeName="main-view">
                <Suspense fallback={<SectionLoading />}>
                  <AnimatePresence mode="wait">
                    {currentView === ViewState.DASHBOARD && (
                      <AnimatedPage key="dashboard" initial="fade">
                        {showMinimalistDashboard ? (
                          <MinimalistDashboard onNavigate={setCurrentView} />
                        ) : (
                          <Dashboard
                            stats={dashboardStats}
                            recentTransactions={dashboardTransactions}
                            onNavigate={setCurrentView}
                          />
                        )}
                      </AnimatedPage>
                    )}
                    {currentView === ViewState.GROUPS && canAccess(ViewState.GROUPS) && (
                      <AnimatedPage key="groups" initial="slide">
                        <Groups onNavigate={setCurrentView} institutionId={institutionId} />
                      </AnimatedPage>
                    )}
                    {currentView === ViewState.INSTITUTIONS && canAccess(ViewState.INSTITUTIONS) && (
                      <AnimatedPage key="institutions" initial="slide">
                        <Institutions onNavigate={setCurrentView} />
                      </AnimatedPage>
                    )}
                    {currentView === ViewState.MEMBERS && canAccess(ViewState.MEMBERS) && (
                      <AnimatedPage key="members" initial="slide">
                        <Members onNavigate={setCurrentView} />
                      </AnimatedPage>
                    )}
                    {currentView === ViewState.TRANSACTIONS && canAccess(ViewState.TRANSACTIONS) && (
                      <AnimatedPage key="transactions" initial="slide">
                        <Transactions onNavigate={setCurrentView} />
                      </AnimatedPage>
                    )}
                    {currentView === ViewState.REPORTS && canAccess(ViewState.REPORTS) && (
                      <AnimatedPage key="reports" initial="slide">
                        <Reports />
                      </AnimatedPage>
                    )}
                    {currentView === ViewState.STAFF && canAccess(ViewState.STAFF) && (
                      <AnimatedPage key="staff" initial="slide">
                        <Staff
                          currentUser={currentUser}
                          onImpersonate={(staff) => {
                            setViewingAsUser(staff);
                            setCurrentView(ViewState.DASHBOARD);
                          }}
                        />
                      </AnimatedPage>
                    )}
                    {currentView === ViewState.SETTINGS && canAccess(ViewState.SETTINGS) && (
                      <AnimatedPage key="settings" initial="slide">
                        <SettingsPage />
                      </AnimatedPage>
                    )}
                    {currentView === ViewState.SMS_GATEWAY_DEVICES && canAccess(ViewState.SMS_GATEWAY_DEVICES) && (
                      <AnimatedPage key="sms-gateway" initial="slide">
                        <SmsGatewayDevices />
                      </AnimatedPage>
                    )}
                    {currentView === ViewState.PROFILE && (
                      <AnimatedPage key="profile" initial="fade">
                        <Profile user={currentUser} />
                      </AnimatedPage>
                    )}

                    {!canAccess(currentView) &&
                      currentView !== ViewState.PROFILE &&
                      currentView !== ViewState.DASHBOARD && (
                        <AnimatedPage key="access-denied" initial="scale">
                          <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="bg-red-50 p-6 rounded-full mb-4 text-red-500">
                              <Eye size={48} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700">Access Denied</h3>
                            <p className="max-w-sm text-center mt-2">
                              Your role as <strong>{currentUser.role}</strong> does not have permission to view this section.
                            </p>
                          </div>
                        </AnimatedPage>
                      )}
                  </AnimatePresence>
                </Suspense>
              </RouteErrorBoundary>
            </div>

            {isMobileMenuOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              ></div>
            )}
          </main>

          {/* Session Timeout Warning Modal */}
          <SessionWarningModal
            isOpen={sessionTimeout.isWarning}
            remainingSeconds={sessionTimeout.remainingSeconds}
            timeoutType={sessionTimeout.timeoutType}
            onExtend={sessionTimeout.extendSession}
            onLogout={sessionTimeout.logout}
          />

          {/* Change Password Modal */}
          <Suspense fallback={null}>
            <ChangePasswordModal
              isOpen={isChangePasswordOpen}
              onClose={() => setIsChangePasswordOpen(false)}
            />
          </Suspense>
        </div>
      </AppBoot>
    </Suspense>
  );
};

export default App;
