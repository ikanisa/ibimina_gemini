import React from 'react';
import { Building, Cpu, Smartphone, Users, FileText, Server } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { SettingsCard } from '../SettingsCard';
import { HealthBanner } from '../HealthBanner';

interface SettingsHomeProps {
  onNavigate: (tab: string) => void;
}

export const SettingsHome: React.FC<SettingsHomeProps> = ({ onNavigate }) => {
  const { role } = useAuth();
  
  const isAdmin = role === 'Super Admin' || role === 'Branch Manager';
  const isPlatformAdmin = role === 'Super Admin';

  const mainTiles = [
    {
      id: 'institution',
      title: 'Institution & MoMo',
      description: 'Manage your institution profile and MoMo payment codes',
      icon: Building
    },
    {
      id: 'parsing',
      title: 'Parsing',
      description: 'Configure SMS parsing mode, confidence thresholds, and deduplication',
      icon: Cpu
    },
    {
      id: 'sms-sources',
      title: 'SMS Sources',
      description: 'Manage Android gateways and webhooks that send MoMo SMS',
      icon: Smartphone
    }
  ];

  const adminTiles = [
    {
      id: 'staff',
      title: 'Staff',
      description: 'Invite and manage staff members for your institution',
      icon: Users
    },
    {
      id: 'audit-log',
      title: 'Audit Log',
      description: 'View system activity and track changes',
      icon: FileText
    }
  ];

  const platformTiles = [
    {
      id: 'system',
      title: 'System',
      description: 'Platform-wide settings and statistics',
      icon: Server
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your institution and system preferences</p>
      </div>

      {/* Health Banner - will be populated by actual checks later */}
      <HealthBanner issues={[]} />

      {/* Main Settings */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mainTiles.map(tile => (
            <SettingsCard
              key={tile.id}
              title={tile.title}
              description={tile.description}
              icon={tile.icon}
              variant="compact"
              onClick={() => onNavigate(tile.id)}
            />
          ))}
        </div>
      </div>

      {/* Admin Settings */}
      {isAdmin && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Administration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminTiles.map(tile => (
              <SettingsCard
                key={tile.id}
                title={tile.title}
                description={tile.description}
                icon={tile.icon}
                variant="compact"
                onClick={() => onNavigate(tile.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Platform Admin Settings */}
      {isPlatformAdmin && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Platform
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformTiles.map(tile => (
              <SettingsCard
                key={tile.id}
                title={tile.title}
                description={tile.description}
                icon={tile.icon}
                variant="compact"
                onClick={() => onNavigate(tile.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsHome;


