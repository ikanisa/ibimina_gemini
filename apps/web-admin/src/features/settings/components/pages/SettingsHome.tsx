import React from 'react';
import { useRoleAccess } from '@/features/settings/hooks/useRoleAccess';
import { SettingsCard } from '../SettingsCard';
import { HealthBanner } from '../HealthBanner';
import { SETTINGS_NAV_ITEMS } from '@/features/settings/constants';
import type { SettingsTab } from '@/features/settings/types';

interface SettingsHomeProps {
  onNavigate: (tab: SettingsTab) => void;
}

export const SettingsHome: React.FC<SettingsHomeProps> = ({ onNavigate }) => {
  const access = useRoleAccess();

  const mainTiles = SETTINGS_NAV_ITEMS.filter(item =>
    !item.adminOnly && !item.platformOnly
  );

  const adminTiles = SETTINGS_NAV_ITEMS.filter(item =>
    item.adminOnly && !item.platformOnly
  );

  const platformTiles = SETTINGS_NAV_ITEMS.filter(item =>
    item.platformOnly
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your institution and system preferences</p>
      </div>

      {/* Health Banner */}
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
              title={tile.label}
              description={tile.description}
              icon={tile.icon}
              variant="compact"
              onClick={() => onNavigate(tile.id)}
            />
          ))}
        </div>
      </div>

      {/* Admin Settings */}
      {access.canManageStaff && adminTiles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Administration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminTiles.map(tile => (
              <SettingsCard
                key={tile.id}
                title={tile.label}
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
      {access.canManageSystem && platformTiles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Platform
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformTiles.map(tile => (
              <SettingsCard
                key={tile.id}
                title={tile.label}
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
