
import React, { useState, useEffect, Suspense, lazy } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Smartphone,
  Settings,
  FileText,
  Menu,
  Bell,
  Search,
  WifiOff,
  LogOut,
  Building,
  Briefcase,
  Scale,
  ShieldCheck,
  Inbox,
  PieChart,
  ChevronDown,
  UserCircle,
  Eye,
  KeyRound
} from 'lucide-react';
const Dashboard = lazy(() => import('./components/Dashboard'));
const MinimalistDashboard = lazy(() => import('./components/MinimalistDashboard'));
const Groups = lazy(() => import('./components/Groups'));
const Members = lazy(() => import('./components/Members'));
const Transactions = lazy(() => import('./components/Transactions'));
const AllocationQueue = lazy(() => import('./components/AllocationQueue'));
const MoMoOperations = lazy(() => import('./components/MoMoOperations'));
const Payments = lazy(() => import('./components/Payments'));
const Saccos = lazy(() => import('./components/Saccos'));
const Institutions = lazy(() => import('./components/institutions/Institutions'));

const Reconciliation = lazy(() => import('./components/Reconciliation'));
const Reports = lazy(() => import('./components/Reports'));
const Staff = lazy(() => import('./components/Staff'));
const Profile = lazy(() => import('./components/Profile'));
const Loans = lazy(() => import('./components/Loans'));
const SettingsPage = lazy(() => import('./components/Settings'));
const Login = lazy(() => import('./components/Login'));
const ChangePasswordModal = lazy(() => import('./components/ChangePasswordModal'));
const AppBoot = lazy(() => import('./components/AppBoot'));
const SystemHealthIndicator = lazy(() => import('./components/SystemHealthIndicator'));
import { MOCK_MEMBERS, MOCK_STATS, MOCK_TRANSACTIONS, MOCK_STAFF } from './constants';
import { ViewState, StaffRole, StaffMember, KpiStats, SupabaseProfile } from './types';
import { useAuth } from './contexts/AuthContext';
import { buildInitialsAvatar } from './lib/avatars';
import { clearAllAppCachesAndReload } from './lib/pwa';

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
  reconciliationStatus: 'Pending'
};

const mapUserToStaffMember = (user: User, role: StaffRole | null, profile: SupabaseProfile | null): StaffMember => {
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
    avatarUrl
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
            onClick={() => clearAllAppCachesAndReload()}
            className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-800 underline underline-offset-2"
          >
            Stuck loading? Clear cache & reload
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
        Set <span className="font-mono">VITE_SUPABASE_URL</span> and <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> in <span className="font-mono">.env.local</span> to continue.
      </p>
      <div className="text-left text-xs bg-slate-100 border border-slate-200 rounded-lg p-3 font-mono text-slate-600">
        VITE_SUPABASE_URL=https://your-project.supabase.co<br />
        VITE_SUPABASE_ANON_KEY=your-anon-key
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const { user, profile, role, institutionId, loading, signOut, isConfigured } = useAuth();
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleSignOut = async () => {
    setViewingAsUser(null);
    setIsProfileMenuOpen(false);
    setIsRoleSwitcherOpen(false);
    await signOut();
  };

  const dashboardStats = useMockData ? MOCK_STATS : EMPTY_STATS;
  const dashboardTransactions = useMockData ? MOCK_TRANSACTIONS : [];
  const showMinimalistDashboard = !useMockData; // Use minimalist dashboard with RPC when not in mock mode

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
    if (!user || !baseUser) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <Login />
        </Suspense>
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

    switch (view) {
      case ViewState.DASHBOARD:
      case ViewState.GROUPS: // Everyone sees groups
      case ViewState.PROFILE:
        return true;
      case ViewState.SACCOS:
      case ViewState.INSTITUTIONS:
      case ViewState.STAFF:
      case ViewState.SETTINGS:
        return ['Super Admin'].includes(effectiveRole);
      case ViewState.RECONCILIATION:
        return ['Super Admin', 'Branch Manager', 'Auditor'].includes(effectiveRole);
      case ViewState.REPORTS:
        return ['Super Admin', 'Branch Manager', 'Auditor', 'Loan Officer'].includes(effectiveRole);
      case ViewState.MEMBERS:
      case ViewState.TRANSACTIONS:
      case ViewState.ALLOCATION_QUEUE:
        return true;
      case ViewState.ACCOUNTS:
      case ViewState.LOANS:
        return ['Super Admin', 'Branch Manager', 'Loan Officer'].includes(effectiveRole);
      case ViewState.MOMO_OPERATIONS: // Staff see SMS parsing
        return ['Super Admin', 'Branch Manager', 'Teller', 'Loan Officer'].includes(effectiveRole);

      default:
        return false;
    }
  };

  const NavItem: React.FC<{ view: ViewState; icon: React.ReactNode; label: string }> = ({ view, icon, label }) => {
    if (!canAccess(view)) return null;

    return (
      <button
        onClick={() => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mb-1 min-h-[44px] touch-manipulation ${currentView === view
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-[1.02]'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white active:scale-[0.98]'
          }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  const RoleSwitcher = () => {
    if (!useMockData) return null;
    if (isImpersonating) return null;
    if (originalUser.role !== 'Super Admin') return null;

    return (
      <div className="px-4 py-3 mt-auto border-t border-slate-800">
        <button
          onClick={() => setIsRoleSwitcherOpen(!isRoleSwitcherOpen)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white mb-2 uppercase font-bold tracking-wider"
        >
          <span>Admin: Switch Role</span>
          <ChevronDown size={14} />
        </button>

        {isRoleSwitcherOpen && (
          <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
            {MOCK_STAFF.map(staff => (
              <button
                key={staff.id}
                onClick={() => {
                  if (staff.id === originalUser.id) {
                    setViewingAsUser(null);
                  } else {
                    setViewingAsUser(staff);
                  }
                  setIsRoleSwitcherOpen(false);
                }}
                className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 ${currentUser.id === staff.id ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                  }`}
              >
                <div className={`w-2 h-2 rounded-full ${staff.role === 'Super Admin' ? 'bg-purple-500' :
                  staff.role === 'Branch Manager' ? 'bg-blue-500' :
                    staff.role === 'Teller' ? 'bg-green-500' :
                      staff.role === 'Loan Officer' ? 'bg-orange-500' : 'bg-indigo-500'
                  }`}></div>
                {staff.role}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AppBoot>
        <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
          {/* Sidebar */}
          <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col shadow-xl md:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">S+</div>
              <h1 className="text-xl font-bold tracking-tight">SACCO+</h1>
            </div>

            <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
              <div className="px-4 mb-4 flex items-center gap-3">
                <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full bg-slate-700" alt="" />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
                </div>
              </div>

              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Core</p>
              <NavItem view={ViewState.DASHBOARD} icon={<LayoutDashboard size={18} />} label="Dashboard" />
              <NavItem view={ViewState.GROUPS} icon={<Briefcase size={18} />} label="Groups (Ibimina)" />
              <NavItem view={ViewState.MEMBERS} icon={<Users size={18} />} label="Members" />

              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Finance</p>
              <NavItem view={ViewState.LOANS} icon={<FileText size={18} />} label="Loans" />
              <NavItem view={ViewState.TRANSACTIONS} icon={<FileText size={18} />} label="Transactions" />
              <NavItem view={ViewState.ALLOCATION_QUEUE} icon={<Inbox size={18} />} label="Allocation Queue" />


              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Operations</p>
              <NavItem view={ViewState.MOMO_OPERATIONS} icon={<Smartphone size={18} />} label="MoMo SMS (Staff)" />
              <NavItem view={ViewState.PAYMENTS} icon={<CreditCard size={18} />} label="All Payments" />
              <NavItem view={ViewState.RECONCILIATION} icon={<Scale size={18} />} label="Reconciliation" />
              <NavItem view={ViewState.REPORTS} icon={<PieChart size={18} />} label="Reports" />

              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">System</p>
              <NavItem view={ViewState.INSTITUTIONS} icon={<Building size={18} />} label="Institutions" />
              <NavItem view={ViewState.SACCOS} icon={<Building size={18} />} label="SACCOs & Branches" />
              <NavItem view={ViewState.STAFF} icon={<ShieldCheck size={18} />} label="Staff & Roles" />
              <NavItem view={ViewState.SETTINGS} icon={<Settings size={18} />} label="Settings" />
            </nav>

            <RoleSwitcher />

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 text-slate-400 hover:text-white text-sm w-full px-4 py-2 rounded hover:bg-slate-800 transition-colors"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </aside>

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

            {/* Demo mode banner - only visible when VITE_USE_MOCK_DATA=true */}
            {useMockData && (
              <div className={`px-4 py-2 text-xs font-medium flex items-center justify-between ${
                import.meta.env.PROD 
                  ? 'bg-red-600 text-white' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <span>
                  {import.meta.env.PROD 
                    ? '⚠️ DANGER: Mock data mode in production! Authentication is bypassed.' 
                    : 'Demo mode enabled: showing mock data and roles.'}
                </span>
              </div>
            )}

            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-40 sticky top-0 backdrop-blur-sm bg-white/95">
              <div className="flex items-center gap-4">
                <button
                  className="md:hidden text-slate-500 p-2 -ml-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all duration-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  <Menu size={24} />
                </button>
                <h2 className="text-base md:text-lg font-semibold text-slate-800 truncate">
                  {currentView === ViewState.DASHBOARD && `${currentUser.role} Dashboard`}
                  {currentView === ViewState.GROUPS && 'Ibimina (Groups Management)'}
                  {currentView === ViewState.SACCOS && 'SACCOs & Branches'}
                  {currentView === ViewState.INSTITUTIONS && 'Institutions Management'}
                  {currentView === ViewState.MEMBERS && 'Member Management'}
                  {currentView === ViewState.TRANSACTIONS && 'Ledger'}
                  {currentView === ViewState.ALLOCATION_QUEUE && 'Allocation Queue'}
                  {currentView === ViewState.MOMO_OPERATIONS && 'Mobile Money SMS Parsing'}

                  {currentView === ViewState.RECONCILIATION && 'Reconciliation Center'}
                  {currentView === ViewState.REPORTS && 'Reports & Analytics'}
                  {currentView === ViewState.ACCOUNTS && 'Accounts & Products'}
                  {currentView === ViewState.LOANS && 'Loan Management'}
                  {currentView === ViewState.STAFF && 'Staff Administration'}
                  {currentView === ViewState.SETTINGS && 'System Settings'}
                  {currentView === ViewState.PROFILE && 'My Profile'}
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
                  <Suspense fallback={null}>
                    <SystemHealthIndicator onNavigate={setCurrentView} />
                  </Suspense>
                )}
                
                <div className="relative hidden lg:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Global search..."
                    className="pl-9 pr-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 xl:w-64 transition-all"
                  />
                </div>
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
                    <div className={`w-8 h-8 rounded-full overflow-hidden border border-slate-300 ${isImpersonating ? 'ring-2 ring-orange-500' : ''}`}>
                      <img src={currentUser.avatarUrl} alt={currentUser.name} />
                    </div>
                  </button>

                  {isProfileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 border-b border-slate-50">
                          <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                          <p className="text-xs text-slate-500">{currentUser.role}</p>
                        </div>
                        <button
                          onClick={() => {
                            setCurrentView(ViewState.PROFILE);
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <UserCircle size={16} /> My Profile
                        </button>
                        <button
                          onClick={() => {
                            setIsChangePasswordOpen(true);
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <KeyRound size={16} /> Change Password
                        </button>
                        <button
                          onClick={handleSignOut}
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

            {/* View Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
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
                {currentView === ViewState.SACCOS && canAccess(ViewState.SACCOS) && <Saccos onNavigate={setCurrentView} />}
                {currentView === ViewState.INSTITUTIONS && canAccess(ViewState.INSTITUTIONS) && <Institutions onNavigate={setCurrentView} />}
                {currentView === ViewState.MEMBERS && canAccess(ViewState.MEMBERS) && (
                  <Members members={useMockData ? MOCK_MEMBERS : undefined} onNavigate={setCurrentView} />
                )}
                {currentView === ViewState.TRANSACTIONS && canAccess(ViewState.TRANSACTIONS) && (
                  <Transactions transactions={useMockData ? MOCK_TRANSACTIONS : undefined} onNavigate={setCurrentView} />
                )}

                {currentView === ViewState.ALLOCATION_QUEUE && canAccess(ViewState.ALLOCATION_QUEUE) && (
                  <AllocationQueue />
                )}

                {/* Mobile Money SMS Parsing */}
                {currentView === ViewState.MOMO_OPERATIONS && canAccess(ViewState.MOMO_OPERATIONS) && <MoMoOperations />}

                {/* Consolidated Payments */}
                {currentView === ViewState.PAYMENTS && canAccess(ViewState.PAYMENTS) && <Payments />}

                {currentView === ViewState.RECONCILIATION && canAccess(ViewState.RECONCILIATION) && <Reconciliation />}
                {currentView === ViewState.REPORTS && canAccess(ViewState.REPORTS) && <Reports />}
                {currentView === ViewState.LOANS && canAccess(ViewState.LOANS) && <Loans onNavigate={setCurrentView} />}
                {currentView === ViewState.STAFF && canAccess(ViewState.STAFF) && (
                  <Staff
                    currentUser={currentUser}
                    onImpersonate={(staff) => {
                      setViewingAsUser(staff);
                      setCurrentView(ViewState.DASHBOARD);
                    }}
                  />
                )}
                {currentView === ViewState.SETTINGS && canAccess(ViewState.SETTINGS) && <SettingsPage />}
                {currentView === ViewState.PROFILE && <Profile user={currentUser} />}

                {currentView === ViewState.ACCOUNTS && canAccess(currentView) && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="bg-slate-100 p-6 rounded-full mb-4">
                      <PieChart size={48} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">Coming Soon</h3>
                    <p className="max-w-sm text-center mt-2">This module is part of the full SACCO+ suite but is not yet implemented in this preview.</p>
                  </div>
                )}

                {!canAccess(currentView) && currentView !== ViewState.PROFILE && currentView !== ViewState.DASHBOARD && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="bg-red-50 p-6 rounded-full mb-4 text-red-500">
                      <ShieldCheck size={48} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">Access Denied</h3>
                    <p className="max-w-sm text-center mt-2">Your role as <strong>{currentUser.role}</strong> does not have permission to view this section.</p>
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
