import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SettingsLayout } from './settings/SettingsLayout';
import {
  SettingsHome,
  InstitutionSettings,
  ParsingSettings,
  SmsSourcesSettings,
  StaffSettings,
  AuditLogSettings,
  SystemSettings
} from './settings/pages';

type SettingsTab = 'home' | 'institution' | 'parsing' | 'sms-sources' | 'staff' | 'audit-log' | 'system';

interface SettingsProps {
  onNavigateBack?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onNavigateBack }) => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('home');
  
  const isAdmin = role === 'Super Admin' || role === 'Branch Manager';
  const isPlatformAdmin = role === 'Super Admin';

  // Handle tab navigation with role checks
  const handleTabChange = (tab: string) => {
    // Role-based access control
    if (tab === 'staff' && !isAdmin) return;
    if (tab === 'audit-log' && !isAdmin) return;
    if (tab === 'system' && !isPlatformAdmin) return;
    
    setActiveTab(tab as SettingsTab);
  };

  const handleBack = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
    } else if (onNavigateBack) {
      onNavigateBack();
    }
  };

  // Render the appropriate settings page
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <SettingsHome onNavigate={handleTabChange} />;
      case 'institution':
        return <InstitutionSettings />;
      case 'parsing':
        return <ParsingSettings />;
      case 'sms-sources':
        return <SmsSourcesSettings />;
      case 'staff':
        return isAdmin ? <StaffSettings /> : <SettingsHome onNavigate={handleTabChange} />;
      case 'audit-log':
        return isAdmin ? <AuditLogSettings /> : <SettingsHome onNavigate={handleTabChange} />;
      case 'system':
        return isPlatformAdmin ? <SystemSettings /> : <SettingsHome onNavigate={handleTabChange} />;
      default:
        return <SettingsHome onNavigate={handleTabChange} />;
    }
  };

  // Show home page without layout
  if (activeTab === 'home') {
    return (
      <div className="max-w-4xl mx-auto">
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-6"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </button>
        )}
        <SettingsHome onNavigate={handleTabChange} />
      </div>
    );
  }

  // Show sub-pages with layout
  return (
    <div className="max-w-6xl mx-auto">
      <SettingsLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onBack={handleBack}
      >
        {renderContent()}
      </SettingsLayout>
    </div>
  );
};

export default Settings;
