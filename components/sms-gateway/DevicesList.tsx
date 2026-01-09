/**
 * DevicesList Component
 * Displays list of SMS gateway devices in a table format
 */

import React from 'react';
import { MoreHorizontal, CheckCircle2, Ban } from 'lucide-react';
import { Badge, EmptyState, LoadingSpinner, SearchInput } from '../ui';
import { Smartphone } from 'lucide-react';
import type { SmsGatewayDevice } from './types';

interface DevicesListProps {
  devices: SmsGatewayDevice[];
  onSelectDevice: (device: SmsGatewayDevice) => void;
  onActionMenuClick: (device: SmsGatewayDevice, action: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  loading?: boolean;
  selectedDeviceId?: string;
}

export const DevicesList: React.FC<DevicesListProps> = React.memo(({
  devices,
  onSelectDevice,
  onActionMenuClick,
  searchTerm = '',
  onSearchChange,
  loading = false,
  selectedDeviceId,
}) => {
  const formatLastSmsTime = (timestamp: string | null): string => {
    if (!timestamp) return '—';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredDevices = devices.filter(
    (d) =>
      d.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.momo_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.institution_name && d.institution_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && devices.length === 0) {
    return <LoadingSpinner size="lg" text="Loading devices..." />;
  }

  if (filteredDevices.length === 0) {
    return (
      <EmptyState
        icon={Smartphone}
        title={searchTerm ? 'No devices found' : 'No devices yet'}
        description={
          searchTerm
            ? 'No devices match your search.'
            : 'Add devices to get started.'
        }
      />
    );
  }

  return (
    <div className="overflow-y-auto flex-1">
      {/* Table Header */}
      <div className="grid grid-cols-12 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
        <div className="col-span-3">Device</div>
        <div className="col-span-2">MoMo Code</div>
        <div className="col-span-2">Institution</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-2">Last SMS received</div>
        <div className="col-span-1"></div>
      </div>

      {/* Table Body */}
      {filteredDevices.map((device) => (
        <div
          key={device.id}
          className={`grid grid-cols-12 px-4 py-3 items-center border-b border-slate-50 hover:bg-blue-50/50 transition-all duration-150 min-h-[60px] ${
            selectedDeviceId === device.id ? 'bg-blue-50 ring-2 ring-blue-200' : ''
          }`}
        >
          <div className="col-span-3">
            <p className="text-sm font-medium text-slate-900">{device.device_name}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm font-mono text-slate-700">{device.momo_code}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-slate-600">{device.institution_name || '—'}</p>
          </div>
          <div className="col-span-2 flex justify-center">
            <Badge
              variant={device.status === 'active' ? 'success' : 'danger'}
            >
              {device.status === 'active' ? (
                <>
                  <CheckCircle2 size={12} className="mr-1" />
                  Active
                </>
              ) : (
                <>
                  <Ban size={12} className="mr-1" />
                  Suspended
                </>
              )}
            </Badge>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-slate-600">
              {formatLastSmsTime(device.last_sms_received_at)}
            </p>
          </div>
          <div className="col-span-1 flex justify-end relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActionMenuClick(device, 'menu');
              }}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Device actions"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});
