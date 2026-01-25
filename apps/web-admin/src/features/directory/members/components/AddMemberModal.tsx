/**
 * AddMemberModal Component
 * Modal for adding a new member with group selection
 */

import React, { useState } from 'react';
import { Modal, Button, ErrorDisplay, SimpleInput, GroupSearchSelect } from '@/shared/components/ui';
import type { GroupOption } from '@/shared/components/ui/GroupSearchSelect';
import { validateMemberData } from '@/lib/validation';
import { Plus, User } from 'lucide-react';
import type { CreateMemberInput } from '../services/memberService';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institutionId: string;
  createMember: (input: CreateMemberInput) => Promise<unknown>;
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
    groupId: null as string | null,
  });
  const [selectedGroup, setSelectedGroup] = useState<GroupOption | null>(null);

  const handleAddMember = async () => {
    if (!institutionId) {
      setFormErrors({ submit: 'No institution selected' });
      return;
    }

    // Validate using validation utility
    const validation = validateMemberData({
      full_name: newMemberData.full_name,
      phone: newMemberData.phone,
    });

    const errors: Record<string, string> = {};

    if (!validation.isValid) {
      Object.entries(validation.errors).forEach(([key, value]) => {
        if (value) errors[key] = value;
      });
    }

    // Validate group selection
    if (!newMemberData.groupId) {
      errors.group = 'Please select a group';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      // Map form data to service input format (camelCase)
      await createMember({
        institutionId,
        fullName: newMemberData.full_name.trim(),
        phone: validation.normalized?.phone || newMemberData.phone,
        groupId: newMemberData.groupId || undefined,
      });

      // Reset form and close modal
      setNewMemberData({ full_name: '', phone: '', groupId: null });
      setSelectedGroup(null);
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
    setNewMemberData({ full_name: '', phone: '', groupId: null });
    setSelectedGroup(null);
    onClose();
  };

  const handleGroupChange = (groupId: string | null, group: GroupOption | null) => {
    setNewMemberData({ ...newMemberData, groupId });
    setSelectedGroup(group);
    // Clear group error when user selects
    if (groupId && formErrors.group) {
      const { group: _, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Member" size="md">
      <div className="p-6 space-y-5">
        {/* Header Illustration */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <User size={28} className="text-white" />
          </div>
        </div>

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

        <GroupSearchSelect
          label="Group (Ibimina)"
          required
          value={newMemberData.groupId}
          onChange={handleGroupChange}
          error={formErrors.group}
          placeholder="Search and select a group..."
        />

        {/* Selected Group Preview */}
        {selectedGroup && (
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-blue-600 font-medium mb-1">Selected Group</p>
            <p className="text-sm text-slate-900 font-semibold">{selectedGroup.name}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span>{selectedGroup.memberCount} members</span>
              {selectedGroup.frequency && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>{selectedGroup.frequency}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-200 flex gap-3 justify-end bg-slate-50/50">
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
