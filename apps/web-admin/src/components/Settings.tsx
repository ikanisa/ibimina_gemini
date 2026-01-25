import React, { useState, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRoleAccess } from './settings/hooks/useRoleAccess';
import { SettingsLayout } from './settings/SettingsLayout';
import { SettingsTab } from './settings/types';
import {
  SettingsHome,
  InstitutionSettings,
  ParsingSettings,
  SmsSourcesSettings,
  NotificationsSettings,
  StaffSettings,
  AuditLogSettings,
  SystemSettings
} from './settings/pages';

interface SettingsProps {
  onNavigateBack?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onNavigateBack }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('home');
  const access = useRoleAccess();

  const handleTabChange = (tab: SettingsTab) => {
    // Role-based access control
    if (tab === 'staff' && !access.canManageStaff) return;
    if (tab === 'audit-log' && !access.canViewAuditLog) return;
    if (tab === 'system' && !access.canManageSystem) return;
    
    setActiveTab(tab);
  };

  const handleBack = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
    } else if (onNavigateBack) {
      onNavigateBack();
    }
  };

  const renderContent = useMemo(() => {
    switch (activeTab) {
      case 'home':
        return <SettingsHome onNavigate={handleTabChange} />;
      case 'institution':
        return <InstitutionSettings />;
      case 'parsing':
        return <ParsingSettings />;
      case 'sms-sources':
        return <SmsSourcesSettings />;
      case 'notifications':
        return <NotificationsSettings />;
      case 'staff':
        return access.canManageStaff ? <StaffSettings /> : <SettingsHome onNavigate={handleTabChange} />;
      case 'audit-log':
        return access.canViewAuditLog ? <AuditLogSettings /> : <SettingsHome onNavigate={handleTabChange} />;
      case 'system':
        return access.canManageSystem ? <SystemSettings /> : <SettingsHome onNavigate={handleTabChange} />;
      default:
        return <SettingsHome onNavigate={handleTabChange} />;
    }
  }, [activeTab, access, handleTabChange]);

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
        {renderContent}
      </SettingsLayout>
    </div>
  );
};

export default Settings;
