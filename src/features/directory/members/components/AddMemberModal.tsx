/**
 * AddMemberModal Component
 * Modal for adding a new member
 */

import React, { useState } from 'react';
import { Modal, Button, ErrorDisplay, SimpleInput } from '@/shared/components/ui';
import { validateMemberData } from '@/lib/validation';
import { Plus } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institutionId: string;
  createMember: (data: {
    institution_id: string;
    full_name: string;
    phone: string;
    branch: string;
  }) => Promise<unknown>;
}


export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  institutionId,
  createMember,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newMemberData, setNewMemberData] = useState({
    full_name: '',
    phone: '',
    branch: 'HQ',
  });

  const handleAddMember = async () => {
    if (!institutionId) {
      setFormErrors({ submit: 'No institution selected' });
      return;
    }

    // Validate using validation utility
    const validation = validateMemberData(newMemberData);

    if (!validation.isValid) {
      // Cast to Record<string, string> filtering out undefined values
      const errors: Record<string, string> = {};
      Object.entries(validation.errors).forEach(([key, value]) => {
        if (value) errors[key] = value;
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      await createMember({
        institution_id: institutionId,
        full_name: newMemberData.full_name.trim(),
        phone: validation.normalized?.phone || newMemberData.phone,
        branch: newMemberData.branch || 'HQ',
      });

      // Reset form and close modal
      setNewMemberData({ full_name: '', phone: '', branch: 'HQ' });
      setIsSubmitting(false);
      onSuccess();
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Failed to add member',
      });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormErrors({});
    setNewMemberData({ full_name: '', phone: '', branch: 'HQ' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Member" size="md">
      <div className="p-6 space-y-4">
        {formErrors.submit && (
          <ErrorDisplay error={formErrors.submit} variant="inline" />
        )}

        <SimpleInput
          label="Full Name"
          required
          error={formErrors.full_name}
          value={newMemberData.full_name}
          onChange={(e) =>
            setNewMemberData({ ...newMemberData, full_name: e.target.value })
          }
          placeholder="e.g., Jean Pierre Habimana"
        />

        <SimpleInput
          label="Phone Number"
          type="tel"
          required
          error={formErrors.phone}
          hint="Format: +250XXXXXXXXX"
          value={newMemberData.phone}
          onChange={(e) =>
            setNewMemberData({ ...newMemberData, phone: e.target.value })
          }
          placeholder="e.g., +250788123456"
        />

        <SimpleInput
          label="Branch"
          error={formErrors.branch}
          value={newMemberData.branch}
          onChange={(e) =>
            setNewMemberData({ ...newMemberData, branch: e.target.value })
          }
          placeholder="e.g., HQ, Kigali, Huye"
        />
      </div>

      <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAddMember}
          isLoading={isSubmitting}
          leftIcon={<Plus size={16} />}
        >
          Add Member
        </Button>
      </div>
    </Modal>
  );
};
