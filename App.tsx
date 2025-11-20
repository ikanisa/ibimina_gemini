
import React, { useState, useEffect } from 'react';
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
  Wallet,
  PieChart,
  ChevronDown,
  UserCircle,
  Eye
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import Members from './components/Members';
import Transactions from './components/Transactions';
import MoMoOperations from './components/MoMoOperations';
import Saccos from './components/Saccos';
import TokenWallet from './components/TokenWallet';
import Reconciliation from './components/Reconciliation';
import Staff from './components/Staff';
import Profile from './components/Profile';
import Loans from './components/Loans';
import SettingsPage from './components/Settings';
import { MOCK_MEMBERS, MOCK_STATS, MOCK_TRANSACTIONS, MOCK_STAFF } from './constants';
import { ViewState, StaffRole, StaffMember } from './types';

const App: React.FC = () => {
  // AUTH STATE MANAGEMENT
  const [originalUser, setOriginalUser] = useState<StaffMember>(MOCK_STAFF[0]); 
  const [viewingAsUser, setViewingAsUser] = useState<StaffMember | null>(null);

  const currentUser = viewingAsUser || originalUser;
  const isImpersonating = viewingAsUser !== null;

  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);

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
    setCurrentView(ViewState.DASHBOARD);
  }, [currentUser.id]);

  // RBAC Permission Map
  const canAccess = (view: ViewState): boolean => {
    const role = currentUser.role;
    
    switch (view) {
      case ViewState.DASHBOARD:
      case ViewState.GROUPS: // Everyone sees groups
      case ViewState.PROFILE:
        return true;
      case ViewState.SACCOS:
      case ViewState.STAFF:
      case ViewState.SETTINGS:
      case ViewState.NFC_LOGS: // Only Admins see raw NFC logs
        return ['Super Admin'].includes(role);
      case ViewState.RECONCILIATION:
        return ['Super Admin', 'Branch Manager', 'Auditor'].includes(role);
      case ViewState.MEMBERS:
      case ViewState.TRANSACTIONS:
        return true;
      case ViewState.ACCOUNTS:
      case ViewState.LOANS:
        return ['Super Admin', 'Branch Manager', 'Loan Officer'].includes(role);
      case ViewState.MOMO_OPERATIONS: // Staff see SMS parsing
        return ['Super Admin', 'Branch Manager', 'Teller', 'Loan Officer'].includes(role);
      case ViewState.TOKENS:
        return ['Super Admin', 'Branch Manager'].includes(role);
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
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg mb-1 ${
          currentView === view 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  const RoleSwitcher = () => {
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
                className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 ${
                  currentUser.id === staff.id ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  staff.role === 'Super Admin' ? 'bg-purple-500' :
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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
          <NavItem view={ViewState.TOKENS} icon={<CreditCard size={18} />} label="Token Wallets (USD)" />
          
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Operations</p>
          <NavItem view={ViewState.MOMO_OPERATIONS} icon={<Smartphone size={18} />} label="MoMo SMS (Staff)" />
          <NavItem view={ViewState.NFC_LOGS} icon={<CreditCard size={18} />} label="NFC Logs (Admin)" />
          <NavItem view={ViewState.RECONCILIATION} icon={<Scale size={18} />} label="Reconciliation" />
          
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">System</p>
          <NavItem view={ViewState.SACCOS} icon={<Building size={18} />} label="SACCOs & Branches" />
          <NavItem view={ViewState.STAFF} icon={<ShieldCheck size={18} />} label="Staff & Roles" />
          <NavItem view={ViewState.SETTINGS} icon={<Settings size={18} />} label="Settings" />
        </nav>
        
        <RoleSwitcher />

        <div className="p-4 border-t border-slate-800">
           <button className="flex items-center gap-3 text-slate-400 hover:text-white text-sm w-full px-4 py-2 rounded hover:bg-slate-800 transition-colors">
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

        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 hidden md:block">
              {currentView === ViewState.DASHBOARD && `${currentUser.role} Dashboard`}
              {currentView === ViewState.GROUPS && 'Ibimina (Groups Management)'}
              {currentView === ViewState.SACCOS && 'SACCOs & Branches'}
              {currentView === ViewState.MEMBERS && 'Member Management'}
              {currentView === ViewState.TRANSACTIONS && 'Ledger'}
              {currentView === ViewState.MOMO_OPERATIONS && 'Mobile Money SMS Parsing'}
              {currentView === ViewState.NFC_LOGS && 'NFC System Logs'}
              {currentView === ViewState.TOKENS && 'USD Token Wallets'}
              {currentView === ViewState.RECONCILIATION && 'Reconciliation Center'}
              {currentView === ViewState.ACCOUNTS && 'Accounts & Products'}
              {currentView === ViewState.LOANS && 'Loan Management'}
              {currentView === ViewState.STAFF && 'Staff Administration'}
              {currentView === ViewState.SETTINGS && 'System Settings'}
              {currentView === ViewState.PROFILE && 'My Profile'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
             {isOffline && (
               <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
                 <WifiOff size={14} /> Offline Mode
               </div>
             )}
             <div className="relative hidden md:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input type="text" placeholder="Global search..." className="pl-9 pr-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all" />
             </div>
             <button className="relative text-slate-500 hover:text-blue-600 transition-colors">
               <Bell size={20} />
               <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
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
                     <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                       <LogOut size={16} /> Sign Out
                     </button>
                   </div>
                 </>
               )}
             </div>
          </div>
        </header>

        {/* View Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
           {currentView === ViewState.DASHBOARD && (
             <Dashboard 
               stats={MOCK_STATS} 
               recentTransactions={MOCK_TRANSACTIONS} 
               onNavigate={setCurrentView}
             />
           )}
           {currentView === ViewState.GROUPS && canAccess(ViewState.GROUPS) && <Groups onNavigate={setCurrentView} />}
           {currentView === ViewState.SACCOS && canAccess(ViewState.SACCOS) && <Saccos onNavigate={setCurrentView} />}
           {currentView === ViewState.MEMBERS && canAccess(ViewState.MEMBERS) && <Members members={MOCK_MEMBERS} onNavigate={setCurrentView} />}
           {currentView === ViewState.TRANSACTIONS && canAccess(ViewState.TRANSACTIONS) && <Transactions transactions={MOCK_TRANSACTIONS} onNavigate={setCurrentView} />}
           
           {/* Split Mobile Money Views */}
           {currentView === ViewState.MOMO_OPERATIONS && canAccess(ViewState.MOMO_OPERATIONS) && <MoMoOperations mode="sms" />}
           {currentView === ViewState.NFC_LOGS && canAccess(ViewState.NFC_LOGS) && <MoMoOperations mode="nfc" />}
           
           {currentView === ViewState.TOKENS && canAccess(ViewState.TOKENS) && <TokenWallet />}
           {currentView === ViewState.RECONCILIATION && canAccess(ViewState.RECONCILIATION) && <Reconciliation />}
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
        </div>
        
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}
      </main>
    </div>
  );
};

export default App;
