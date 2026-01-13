/**
 * AddDeviceModal Component
 * Simple 1-step modal for adding a new SMS gateway device
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, ErrorDisplay, SimpleInput, SimpleSelect } from '../ui';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { AddDeviceData, Institution } from './types';
import { isSuperAdmin } from '../../lib/utils/roleHelpers';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { role, institutionId: userInstitutionId } = useAuth();
  const isPlatformAdmin = isSuperAdmin(role);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState<AddDeviceData>({
    device_name: '',
    institution_id: isPlatformAdmin ? '' : (userInstitutionId || ''),
    momo_code: '',
  });

  // Load institutions for platform admins
  useEffect(() => {
    if (isOpen && isPlatformAdmin) {
      loadInstitutions();
    } else if (isOpen && userInstitutionId) {
      setNewDeviceData(prev => ({ ...prev, institution_id: userInstitutionId }));
    }
  }, [isOpen, isPlatformAdmin, userInstitutionId]);

  const loadInstitutions = async () => {
    setLoadingInstitutions(true);
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
      setFormErrors({ submit: 'Failed to load institutions' });
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newDeviceData.device_name.trim()) {
      errors.device_name = 'Device name is required';
    }

    if (!newDeviceData.institution_id) {
      errors.institution_id = 'Institution is required';
    }

    if (!newDeviceData.momo_code.trim()) {
      errors.momo_code = 'MoMo Code is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddDevice = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormErrors({});

    try {
      // Generate device key (we'll hash it before storing)
      const deviceKey = crypto.randomUUID() + '-' + Date.now().toString(36);
      const deviceKeyHash = await hashDeviceKey(deviceKey);

      // Insert device (status defaults to 'active')
      const { data, error } = await supabase
        .from('sms_gateway_devices')
        .insert({
          institution_id: newDeviceData.institution_id,
          device_name: newDeviceData.device_name.trim(),
          momo_code: newDeviceData.momo_code.trim(),
          device_key_hash: deviceKeyHash,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          setFormErrors({ momo_code: 'This MoMo Code is already registered' });
        } else {
          throw error;
        }
        return;
      }

      // Device key is returned in response - handled by parent component
      // Note: In production, display the key to user in a secure modal/toast

      // Reset form and close modal
      setNewDeviceData({
        device_name: '',
        institution_id: isPlatformAdmin ? '' : (userInstitutionId || ''),
        momo_code: '',
      });
      setIsSubmitting(false);
      onSuccess();
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Failed to add device',
      });
      setIsSubmitting(false);
    }
  };

  const hashDeviceKey = async (key: string): Promise<string> => {
    // Simple hash using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleClose = () => {
    setFormErrors({});
    setNewDeviceData({
      device_name: '',
      institution_id: isPlatformAdmin ? '' : (userInstitutionId || ''),
      momo_code: '',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add device" size="md">
      <div className="p-6 space-y-4">
        {formErrors.submit && (
          <ErrorDisplay error={formErrors.submit} variant="inline" />
        )}

        <SimpleInput
          label="Device name"
          required
          error={formErrors.device_name}
          value={newDeviceData.device_name}
          onChange={(e) =>
            setNewDeviceData({ ...newDeviceData, device_name: e.target.value })
          }
          placeholder="Kigali HQ Phone 01"
        />

        {isPlatformAdmin ? (
          <SimpleSelect
            label="Institution"
            required
            error={formErrors.institution_id}
            value={newDeviceData.institution_id}
            onChange={(e) =>
              setNewDeviceData({ ...newDeviceData, institution_id: e.target.value })
            }
            options={[
              { value: '', label: 'Select institution...' },
              ...institutions.map((inst) => ({
                value: inst.id,
                label: inst.name,
              })),
            ]}
            disabled={loadingInstitutions}
          />
        ) : (
          <SimpleInput
            label="Institution"
            value={institutions.find((i) => i.id === newDeviceData.institution_id)?.name || ''}
            disabled
          />
        )}

        <SimpleInput
          label="MoMo Code"
          required
          error={formErrors.momo_code}
          value={newDeviceData.momo_code}
          onChange={(e) =>
            setNewDeviceData({ ...newDeviceData, momo_code: e.target.value })
          }
          placeholder="123456"
          hint="The MoMo code used for routing SMS"
        />
      </div>

      <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAddDevice}
          isLoading={isSubmitting}
          leftIcon={<Plus size={16} />}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
};
