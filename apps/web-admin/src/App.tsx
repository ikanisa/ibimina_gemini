/**
 * App Component (Refactored)
 * Main application container with navigation
 * Uses feature-based module structure
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import { Eye, WifiOff } from 'lucide-react';

// Core imports
import { ViewState, StaffRole, StaffMember, KpiStats, SupabaseProfile } from '@/core/types';
import { useAuth } from '@/core/auth';

// Shared UI and component imports
import { buildInitialsAvatar } from './lib/avatars';
import { AppShell } from '@/shared/components/layout/AppShell';
import { AnimatedPage } from '@/shared/components/ui';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { useSessionTimeout } from './hooks/useSessionTimeout';

// Lazy-loaded feature components
const Dashboard = lazy(() => import('@/features/dashboard/components/Dashboard'));
const MinimalistDashboard = lazy(() => import('@/features/dashboard/components/MinimalistDashboard'));
const Groups = lazy(() => import('@/features/directory/groups/components/Groups'));
const Members = lazy(() => import('@/features/directory/members/components/Members'));
const Transactions = lazy(() => import('@/features/transactions/components/Transactions'));
const Institutions = lazy(() => import('./components/institutions/Institutions'));
const Reports = lazy(() => import('@/features/reports/components/Reports'));
const Staff = lazy(() => import('./components/Staff'));
const Profile = lazy(() => import('./components/Profile'));
const SettingsPage = lazy(() => import('@/features/settings/components/Settings'));
const SmsGatewayDevices = lazy(() => import('./components/sms-gateway/SmsGatewayDevices'));
const Loans = lazy(() => import('@/features/loans/components/Loans'));
const Login = lazy(() => import('@/features/auth/components/Login'));
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
  totalDeposits: 0,
  totalLoans: 0,
  outstandingLoans: 0,
  unallocatedCount: 0,
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-900">
      <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-neutral-400">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 dark:border-neutral-700 border-t-blue-600 dark:border-t-primary-500 animate-spin"></div>
        <p className="text-sm font-medium">Loading session...</p>
        {showHelp && (
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs font-medium text-blue-700 dark:text-primary-400 hover:text-blue-800 dark:hover:text-primary-300 underline underline-offset-2"
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
} from '@/shared/components/ui/PageSkeletons';

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
          <div className="h-8 w-48 bg-slate-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
          <div className="h-8 w-24 bg-slate-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const MissingConfig: React.FC = () => {
  const handleClearAndReload = () => {
    // Clear caches and reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      });
    }
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-900 p-6">
      <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-sm p-8 max-w-lg w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Supabase configuration required</h1>
        <p className="text-sm text-slate-600 dark:text-neutral-400">
          Set <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
          <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> in{' '}
          <span className="font-mono">.env.local</span> to continue.
        </p>
        <div className="text-left text-xs bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg p-3 font-mono text-slate-600 dark:text-neutral-400">
          VITE_SUPABASE_URL=https://your-project.supabase.co<br />
          VITE_SUPABASE_ANON_KEY=your-anon-key
        </div>

        {/* Diagnostic info */}
        <div className="text-left text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 space-y-1">
          <p className="font-medium text-amber-800 dark:text-amber-400">Troubleshooting:</p>
          <ul className="list-disc list-inside text-amber-700 dark:text-amber-500 space-y-0.5">
            <li>Check browser DevTools console for <code>[Supabase Config]</code> log</li>
            <li>Restart dev server after changing .env.local</li>
            <li>For Cloudflare: Set env vars in Pages → Settings</li>
          </ul>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2 bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-slate-800 dark:hover:bg-neutral-200 transition-colors text-sm font-medium"
          >
            Reload
          </button>
          <button
            onClick={handleClearAndReload}
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
          >
            Clear Cache & Reload
          </button>
        </div>
      </div>
    </div>
  );
};

const InitError: React.FC<{ error: string }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-900 p-6">
    <div className="bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-8 max-w-lg w-full text-center space-y-4">
      <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
        <WifiOff size={24} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Connection Error</h1>
      <p className="text-slate-600 dark:text-neutral-400">
        We couldn't connect to the server. This might be a network issue or a configuration problem.
      </p>
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm font-mono text-left overflow-auto max-h-32">
        {error}
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-slate-800 dark:hover:bg-neutral-200 transition-colors"
      >
        Retry Connection
      </button>
    </div>
  </div>
);

const AccountNotProvisioned: React.FC<{ email?: string; userId: string }> = ({ email, userId }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-900 p-6">
    <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-sm p-8 max-w-lg w-full text-center space-y-4">
      <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
        <Eye size={24} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Account Setup Required</h1>
      <p className="text-slate-600 dark:text-neutral-400">
        You are signed in, but your account hasn't been linked to an institution yet.
      </p>
      <div className="bg-slate-50 dark:bg-neutral-900 p-4 rounded-lg text-sm text-left space-y-2 border border-slate-200 dark:border-neutral-700">
        <p>
          <span className="font-semibold text-slate-500 dark:text-neutral-400">Email:</span>{' '}
          <span className="dark:text-neutral-300">{email}</span>
        </p>
        <p>
          <span className="font-semibold text-slate-500 dark:text-neutral-400">User ID:</span>{' '}
          <span className="font-mono text-xs dark:text-neutral-300">{userId}</span>
        </p>
      </div>
      <p className="text-sm text-slate-500 dark:text-neutral-400">
        Please contact your administrator to create your staff profile and link it to an institution.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="text-blue-600 dark:text-primary-400 hover:text-blue-800 dark:hover:text-primary-300 text-sm font-medium hover:underline"
      >
        Check Again
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const { user, profile, role, institutionId, loading, signOut, isConfigured, error } = useAuth();



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
  // isMobileMenuOpen and isChangePasswordOpen moved to AppShell
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const handleSignOut = async () => {
    setViewingAsUser(null);
    await signOut();
  };

  const dashboardStats = EMPTY_STATS;
  const dashboardTransactions: never[] = [];
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewingAsUser(null);
  }, [baseUser?.id]);

  useEffect(() => {
    if (currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const isPlatformAdmin = role === 'Admin' || role?.toUpperCase() === 'ADMIN';
  const hasValidAccess = isPlatformAdmin || (institutionId && profile);

  if (!hasValidAccess) {
    // User is authenticated but doesn't have a profile
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
    const isAdmin = roleUpper === 'ADMIN';
    const isStaff = roleUpper === 'STAFF';

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
      case ViewState.LOANS:
        return true;

      // Admin-only views
      case ViewState.INSTITUTIONS:
      case ViewState.STAFF:
      case ViewState.SETTINGS:
      case ViewState.SMS_GATEWAY_DEVICES:
        return false;

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
        <AppShell
          currentUser={currentUser}
          currentView={currentView}
          onNavigate={setCurrentView}
          canAccess={canAccess}
          onSignOut={handleSignOut}
          isImpersonating={isImpersonating}
          baseUser={baseUser}
          onStopImpersonating={() => setViewingAsUser(null)}
          onStartImpersonating={(staff) => setViewingAsUser(staff)}
          isOffline={isOffline}
          sessionTimeout={sessionTimeout}
        >
          <RouteErrorBoundary routeName="main-view">
            <Suspense fallback={<SectionLoading />}>
              <AnimatePresence mode="wait">
                {currentView === ViewState.DASHBOARD && (
                  <AnimatedPage key="dashboard" initial="fade">
                    {showMinimalistDashboard ? (
                      <MinimalistDashboard onNavigate={setCurrentView} />
                    ) : (
                      <Dashboard
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
                {currentView === ViewState.LOANS && canAccess(ViewState.LOANS) && (
                  <AnimatedPage key="loans" initial="slide">
                    <Loans />
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
        </AppShell>
      </AppBoot>
    </Suspense>
  );
};

export default App;
