import React, { ReactNode } from 'react';
import { ChevronLeft, Building, Cpu, Smartphone, Users, FileText, Server } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  platformOnly?: boolean;
}

const NAV_ITEMS: SettingsNavItem[] = [
  { id: 'institution', label: 'Institution & MoMo', icon: Building },
  { id: 'parsing', label: 'Parsing', icon: Cpu },
  { id: 'sms-sources', label: 'SMS Sources', icon: Smartphone },
  { id: 'staff', label: 'Staff', icon: Users, adminOnly: true },
  { id: 'audit-log', label: 'Audit Log', icon: FileText, adminOnly: true },
  { id: 'system', label: 'System', icon: Server, platformOnly: true },
];

interface SettingsLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBack: () => void;
  title?: string;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  onBack,
  title = 'Settings'
}) => {
  const { role } = useAuth();
  
  const isAdmin = role === 'Super Admin' || role === 'Branch Manager';
  const isPlatformAdmin = role === 'Super Admin';

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.platformOnly && !isPlatformAdmin) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-0">
          <div className="p-4 border-b border-slate-100">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft size={16} />
              Back to Dashboard
            </button>
          </div>
          <nav className="p-2">
            {visibleItems.map(item => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {visibleItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === item.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};

export default SettingsLayout;

