/**
 * EditDeviceModal Component
 * Modal for editing device name, institution, and MoMo code
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, ErrorDisplay, SimpleInput, SimpleSelect } from '../ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperAdmin } from '../../lib/utils/roleHelpers';
import type { SmsGatewayDevice, Institution, EditDeviceData } from './types';

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device: SmsGatewayDevice | null;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  device,
}) => {
  const { role, institutionId: userInstitutionId } = useAuth();
  const isPlatformAdmin = isSuperAdmin(role);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [editData, setEditData] = useState<EditDeviceData>({
    device_name: '',
    institution_id: '',
    momo_code: '',
  });

  // Load device data when modal opens
  useEffect(() => {
    if (isOpen && device) {
      setEditData({
        device_name: device.device_name,
        institution_id: device.institution_id,
        momo_code: device.momo_code,
      });
    }
  }, [isOpen, device]);

  // Load institutions for platform admins
  useEffect(() => {
    if (isOpen && isPlatformAdmin) {
      loadInstitutions();
    }
  }, [isOpen, isPlatformAdmin]);

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

    if (!editData.device_name.trim()) {
      errors.device_name = 'Device name is required';
    }

    if (!editData.institution_id) {
      errors.institution_id = 'Institution is required';
    }

    if (!editData.momo_code.trim()) {
      errors.momo_code = 'MoMo Code is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!device || !validateForm()) return;

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const { error } = await supabase
        .from('sms_gateway_devices')
        .update({
          device_name: editData.device_name.trim(),
          institution_id: editData.institution_id,
          momo_code: editData.momo_code.trim(),
        })
        .eq('id', device.id);

      if (error) {
        if (error.code === '23505') {
          setFormErrors({ momo_code: 'This MoMo Code is already registered' });
        } else {
          throw error;
        }
        return;
      }

      setIsSubmitting(false);
      onSuccess();
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Failed to update device',
      });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormErrors({});
    if (device) {
      setEditData({
        device_name: device.device_name,
        institution_id: device.institution_id,
        momo_code: device.momo_code,
      });
    }
    onClose();
  };

  if (!device) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit device" size="md">
      <div className="p-6 space-y-4">
        {formErrors.submit && (
          <ErrorDisplay error={formErrors.submit} variant="inline" />
        )}

        <SimpleInput
          label="Device name"
          required
          error={formErrors.device_name}
          value={editData.device_name}
          onChange={(e) =>
            setEditData({ ...editData, device_name: e.target.value })
          }
          placeholder="Kigali HQ Phone 01"
        />

        {isPlatformAdmin ? (
          <SimpleSelect
            label="Institution"
            required
            error={formErrors.institution_id}
            value={editData.institution_id}
            onChange={(e) =>
              setEditData({ ...editData, institution_id: e.target.value })
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
            value={institutions.find((i) => i.id === editData.institution_id)?.name || device.institution_name || ''}
            disabled
          />
        )}

        <SimpleInput
          label="MoMo Code"
          required
          error={formErrors.momo_code}
          value={editData.momo_code}
          onChange={(e) =>
            setEditData({ ...editData, momo_code: e.target.value })
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
          onClick={handleSave}
          isLoading={isSubmitting}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
};
