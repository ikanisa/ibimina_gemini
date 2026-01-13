/**
 * SmsGatewayDevices Component
 * Main page for managing SMS Gateway devices
 */

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Smartphone, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button, SearchInput, SimpleSelect, LoadingSpinner } from '../ui';
import { DevicesList } from './DevicesList';
import { AddDeviceModal } from './AddDeviceModal';
import { EditDeviceModal } from './EditDeviceModal';
import { DeviceDrawer } from './DeviceDrawer';
import type { SmsGatewayDevice, Institution } from './types';
import { isSuperAdmin } from '../../lib/utils/roleHelpers';
import { deduplicateRequest } from '../../lib/utils/requestDeduplication';

export const SmsGatewayDevices: React.FC = () => {
  const { role, institutionId: userInstitutionId } = useAuth();
  const isPlatformAdmin = isSuperAdmin(role);

  // Data state
  const [devices, setDevices] = useState<SmsGatewayDevice[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDevice, setSelectedDevice] = useState<SmsGatewayDevice | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Modal/Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<SmsGatewayDevice | null>(null);

  // Load institutions for filter
  useEffect(() => {
    if (isPlatformAdmin) {
      loadInstitutions();
    }
  }, [isPlatformAdmin]);

  // Load devices
  useEffect(() => {
    loadDevices();
  }, [institutionFilter, statusFilter, userInstitutionId]);

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('status', 'ACTIVE')
        .order('name');

      if (error) throw error;
      if (data) {
        setInstitutions(data);
      }
    } catch (err) {
      console.error('Error loading institutions:', err);
    }
  };

  const loadDevices = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use deduplication to prevent duplicate requests
      const key = `loadDevices:${isPlatformAdmin ? 'all' : userInstitutionId}:${institutionFilter}:${statusFilter}`;
      
      const devicesData = await deduplicateRequest(key, async () => {
        let query = supabase
          .from('sms_gateway_devices')
          .select(`
            *,
            institutions!inner(id, name)
          `)
          .order('created_at', { ascending: false });

        // Filter by institution if not platform admin
        if (!isPlatformAdmin && userInstitutionId) {
          query = query.eq('institution_id', userInstitutionId);
        } else if (institutionFilter !== 'ALL') {
          query = query.eq('institution_id', institutionFilter);
        }

        // Filter by status
        if (statusFilter !== 'ALL') {
          query = query.eq('status', statusFilter.toLowerCase());
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          return data.map((d: any) => ({
            ...d,
            institution_name: d.institutions?.name || null,
          }));
        }
        return [];
      });

      setDevices(devicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
      console.error('Error loading devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionMenuClick = (device: SmsGatewayDevice, action: string) => {
    if (action === 'menu') {
      setActionMenuOpen(actionMenuOpen === device.id ? null : device.id);
    }
  };

  const handleView = (device: SmsGatewayDevice) => {
    setSelectedDevice(device);
    setIsDrawerOpen(true);
    setActionMenuOpen(null);
  };

  const handleEdit = (device: SmsGatewayDevice) => {
    setDeviceToEdit(device);
    setIsEditModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleSuspend = async (device: SmsGatewayDevice) => {
    try {
      const { error } = await supabase
        .from('sms_gateway_devices')
        .update({ status: 'suspended' })
        .eq('id', device.id);

      if (error) throw error;
      await loadDevices();
      if (selectedDevice?.id === device.id) {
        setSelectedDevice({ ...device, status: 'suspended' });
      }
      setActionMenuOpen(null);
    } catch (err) {
      console.error('Error suspending device:', err);
      alert('Failed to suspend device');
    }
  };

  const handleActivate = async (device: SmsGatewayDevice) => {
    try {
      const { error } = await supabase
        .from('sms_gateway_devices')
        .update({ status: 'active' })
        .eq('id', device.id);

      if (error) throw error;
      await loadDevices();
      if (selectedDevice?.id === device.id) {
        setSelectedDevice({ ...device, status: 'active' });
      }
      setActionMenuOpen(null);
    } catch (err) {
      console.error('Error activating device:', err);
      alert('Failed to activate device');
    }
  };

  const handleRemove = async (device: SmsGatewayDevice) => {
    if (!confirm(`Are you sure you want to remove "${device.device_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sms_gateway_devices')
        .delete()
        .eq('id', device.id);

      if (error) throw error;
      await loadDevices();
      if (selectedDevice?.id === device.id) {
        setIsDrawerOpen(false);
        setSelectedDevice(null);
      }
      setActionMenuOpen(null);
    } catch (err) {
      console.error('Error removing device:', err);
      alert('Failed to remove device');
    }
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    loadDevices();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setDeviceToEdit(null);
    loadDevices();
  };

  const filteredDevices = devices.filter(
    (d) =>
      d.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.momo_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.institution_name && d.institution_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">SMS Gateway Devices</h1>
            <p className="text-sm text-slate-500 mt-1">
              Registered phones that forward MoMo payment SMS using a MoMo Code
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add device
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-4">
          {isPlatformAdmin && (
            <div className="w-48">
              <SimpleSelect
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Institutions' },
                  ...institutions.map((inst) => ({
                    value: inst.id,
                    label: inst.name,
                  })),
                ]}
              />
            </div>
          )}
          <div className="w-40">
            <SimpleSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
          </div>
          <div className="flex-1 max-w-md">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              placeholder="Search device name or MoMo code..."
            />
          </div>
        </div>
      </div>

      {/* Devices List */}
      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Loading devices..." />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-2">{error}</p>
              <Button variant="secondary" onClick={loadDevices}>
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DevicesList
              devices={filteredDevices}
              onSelectDevice={handleView}
              onActionMenuClick={handleActionMenuClick}
              searchTerm={searchTerm}
              loading={loading}
              selectedDeviceId={selectedDevice?.id}
            />

            {/* Action Menu */}
            {actionMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setActionMenuOpen(null)}
                />
                <div
                  ref={actionMenuRef}
                  className="fixed bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[160px]"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        const device = devices.find((d) => d.id === actionMenuOpen);
                        if (device) handleView(device);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        const device = devices.find((d) => d.id === actionMenuOpen);
                        if (device) {
                          if (device.status === 'active') {
                            handleSuspend(device);
                          } else {
                            handleActivate(device);
                          }
                        }
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50"
                    >
                      {devices.find((d) => d.id === actionMenuOpen)?.status === 'active'
                        ? 'Suspend'
                        : 'Activate'}
                    </button>
                    <button
                      onClick={() => {
                        const device = devices.find((d) => d.id === actionMenuOpen);
                        if (device) handleEdit(device);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        const device = devices.find((d) => d.id === actionMenuOpen);
                        if (device) handleRemove(device);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modals and Drawer */}
      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <EditDeviceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setDeviceToEdit(null);
        }}
        onSuccess={handleEditSuccess}
        device={deviceToEdit}
      />

      <DeviceDrawer
        device={selectedDevice}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDevice(null);
        }}
        onSuspend={handleSuspend}
        onActivate={handleActivate}
        onRemove={handleRemove}
      />
    </div>
  );
};
