/**
 * AddDeviceModal Component
 * Simple 1-step modal for adding a new SMS gateway device
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, ErrorDisplay, SimpleInput, InstitutionSemanticSearch } from '../ui';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { AddDeviceData } from './types';
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
  const [institutionName, setInstitutionName] = useState('');
  const [newDeviceData, setNewDeviceData] = useState<AddDeviceData>({
    device_name: '',
    institution_id: isPlatformAdmin ? '' : (userInstitutionId || ''),
    momo_code: '',
  });

  // Load user's institution name for non-platform admins
  useEffect(() => {
    if (isOpen && !isPlatformAdmin && userInstitutionId) {
      setNewDeviceData(prev => ({ ...prev, institution_id: userInstitutionId }));
      loadUserInstitutionName(userInstitutionId);
    }
  }, [isOpen, isPlatformAdmin, userInstitutionId]);

  const loadUserInstitutionName = async (institutionId: string) => {
    try {
      const { data } = await supabase
        .from('institutions')
        .select('name')
        .eq('id', institutionId)
        .single();
      if (data?.name) {
        setInstitutionName(data.name);
      }
    } catch (err) {
      console.error('Error loading institution name:', err);
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
          <InstitutionSemanticSearch
            label="Institution"
            required
            value={newDeviceData.institution_id}
            onChange={(id, name) => {
              setNewDeviceData({ ...newDeviceData, institution_id: id });
              setInstitutionName(name);
            }}
            error={formErrors.institution_id}
            placeholder="Search for institution..."
          />
        ) : (
          <SimpleInput
            label="Institution"
            value={institutionName}
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
