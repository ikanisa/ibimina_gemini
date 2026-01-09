/**
 * App Component (Refactored)
 * Main application container with navigation
 * Uses modular navigation components
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import type { User } from '@supabase/supabase-js';
import { Eye, WifiOff } from 'lucide-react';
import { MOCK_MEMBERS, MOCK_STATS, MOCK_TRANSACTIONS, MOCK_STAFF } from './constants';
import { ViewState, StaffRole, StaffMember, KpiStats, SupabaseProfile } from './types';
import { useAuth } from './contexts/AuthContext';
import { buildInitialsAvatar } from './lib/avatars';
import { Sidebar, Header, MobileBottomNav } from './components/navigation';

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
if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK_DATA === 'true') {
  console.error('🚨 CRITICAL: VITE_USE_MOCK_DATA=true in production build! This bypasses authentication.');
}

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
    role: role ?? 'Teller',
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

const SectionLoading: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

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
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const demoUser = useMockData ? (MOCK_STAFF[0] ?? null) : null;
  const baseUser = useMockData ? demoUser : (user ? mapUserToStaffMember(user, role, profile) : null);
  const [viewingAsUser, setViewingAsUser] = useState<StaffMember | null>(null);

  const originalUser = baseUser ?? demoUser;
  const currentUser = viewingAsUser || originalUser;
  const isImpersonating = Boolean(viewingAsUser);

  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleSignOut = async () => {
    setViewingAsUser(null);
    await signOut();
  };

  const dashboardStats = useMockData ? MOCK_STATS : EMPTY_STATS;
  const dashboardTransactions = useMockData ? MOCK_TRANSACTIONS : [];
  const showMinimalistDashboard = !useMockData;

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

  if (!useMockData) {
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
    // If user is logged in but has no institutionId and is NOT a platform admin, they need provisioning
    const isPlatformAdmin = role === 'Super Admin';
    if (!institutionId && !useMockData && !isPlatformAdmin) {
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
  }

  if (!currentUser) {
    return <LoadingScreen />;
  }

  // RBAC Permission Map
  const canAccess = (view: ViewState): boolean => {
    const effectiveRole = useMockData ? currentUser.role : role;
    if (!effectiveRole) return false;

    // Super Admin / Platform Admin has unrestricted access to everything
    if (effectiveRole === 'Super Admin') {
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

      // Admin-only views (Super Admin already returned true above)
      case ViewState.INSTITUTIONS:
      case ViewState.STAFF:
      case ViewState.SETTINGS:
      case ViewState.SMS_GATEWAY_DEVICES:
        return false; // Only Super Admin

      // Manager + Auditor views
      case ViewState.REPORTS:
        return ['Branch Manager', 'Auditor', 'Loan Officer'].includes(effectiveRole);

      default:
        return false;
    }
  };

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AppBoot>
        <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
          {/* Sidebar */}
          <Sidebar
            currentUser={currentUser}
            currentView={currentView}
            onNavigate={setCurrentView}
            onMobileMenuClose={() => setIsMobileMenuOpen(false)}
            canAccess={canAccess}
            useMockData={useMockData}
            originalUser={originalUser}
            isImpersonating={isImpersonating}
            onSignOut={handleSignOut}
            isMobileMenuOpen={isMobileMenuOpen}
            onRoleSwitch={(staff) => setViewingAsUser(staff)}
            onRoleReset={() => setViewingAsUser(null)}
          />

          {/* Main Content */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
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
            {useMockData && (
              <div
                className={`px-4 py-2 text-xs font-medium flex items-center justify-between ${
                  import.meta.env.PROD
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
              useMockData={useMockData}
              isImpersonating={isImpersonating}
              onNavigate={setCurrentView}
              onSignOut={handleSignOut}
              onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              isMobileMenuOpen={isMobileMenuOpen}
              onChangePassword={() => setIsChangePasswordOpen(true)}
            />

            {/* View Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth pb-20 md:pb-6">
              <Suspense fallback={<SectionLoading />}>
                {currentView === ViewState.DASHBOARD && (
                  showMinimalistDashboard ? (
                    <MinimalistDashboard onNavigate={setCurrentView} />
                  ) : (
                    <Dashboard
                      stats={dashboardStats}
                      recentTransactions={dashboardTransactions}
                      onNavigate={setCurrentView}
                    />
                  )
                )}
                {currentView === ViewState.GROUPS && canAccess(ViewState.GROUPS) && (
                  <Groups onNavigate={setCurrentView} institutionId={institutionId} />
                )}
                {currentView === ViewState.INSTITUTIONS && canAccess(ViewState.INSTITUTIONS) && (
                  <Institutions onNavigate={setCurrentView} />
                )}
                {currentView === ViewState.MEMBERS && canAccess(ViewState.MEMBERS) && (
                  <Members members={useMockData ? MOCK_MEMBERS : undefined} onNavigate={setCurrentView} />
                )}
                {currentView === ViewState.TRANSACTIONS && canAccess(ViewState.TRANSACTIONS) && (
                  <Transactions transactions={useMockData ? MOCK_TRANSACTIONS : undefined} onNavigate={setCurrentView} />
                )}
                {currentView === ViewState.REPORTS && canAccess(ViewState.REPORTS) && <Reports />}
                {currentView === ViewState.STAFF && canAccess(ViewState.STAFF) && (
                  <Staff
                    currentUser={currentUser}
                    onImpersonate={(staff) => {
                      setViewingAsUser(staff);
                      setCurrentView(ViewState.DASHBOARD);
                    }}
                  />
                )}
                {currentView === ViewState.SETTINGS && canAccess(ViewState.SETTINGS) && (
                  <SettingsPage />
                )}
                {currentView === ViewState.SMS_GATEWAY_DEVICES && canAccess(ViewState.SMS_GATEWAY_DEVICES) && (
                  <SmsGatewayDevices />
                )}
                {currentView === ViewState.PROFILE && <Profile user={currentUser} />}

                {!canAccess(currentView) &&
                  currentView !== ViewState.PROFILE &&
                  currentView !== ViewState.DASHBOARD && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <div className="bg-red-50 p-6 rounded-full mb-4 text-red-500">
                        <Eye size={48} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700">Access Denied</h3>
                      <p className="max-w-sm text-center mt-2">
                        Your role as <strong>{currentUser.role}</strong> does not have permission to view this section.
                      </p>
                    </div>
                  )}
              </Suspense>
            </div>

            {isMobileMenuOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              ></div>
            )}
          </main>

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
