/**
 * CreateGroupModal Component
 * Modal for creating a new group
 */

import React, { useState } from 'react';
import { Modal, Button, ErrorDisplay, SimpleInput, SimpleSelect } from '@/shared/components/ui';
import { validateGroupData } from '@/lib/validation';
import { Plus } from 'lucide-react';
import type { CreateGroupInput } from '../services/groupService';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institutionId: string;
  createGroup: (input: CreateGroupInput) => Promise<unknown>;
}


export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  institutionId,
  createGroup,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newGroupData, setNewGroupData] = useState({
    group_name: '',
    meeting_day: 'Monday',
    expected_amount: 5000,
    frequency: 'Weekly' as 'Weekly' | 'Monthly',
    cycle_label: '',
  });

  const handleCreateGroup = async () => {
    if (!institutionId) {
      setFormErrors({ submit: 'No institution selected' });
      return;
    }

    // Validate using validation utility
    const validation = validateGroupData(newGroupData);

    if (!validation.isValid) {
      setFormErrors(validation.errors as Record<string, string>);
      return;
    }


    setIsSubmitting(true);
    setFormErrors({});

    try {
      // Map form data to service input format (camelCase)
      await createGroup({
        institutionId,
        name: newGroupData.group_name.trim(),
        meetingDay: newGroupData.meeting_day,
        contributionAmount: newGroupData.expected_amount,
        meetingFrequency: newGroupData.frequency,
        description: newGroupData.cycle_label || `Cycle ${new Date().getFullYear()}`,
      });

      // Reset form and close modal
      setNewGroupData({
        group_name: '',
        meeting_day: 'Monday',
        expected_amount: 5000,
        frequency: 'Weekly',
        cycle_label: '',
      });
      setIsSubmitting(false);
      onSuccess();
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : 'Failed to create group',
      });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormErrors({});
    setNewGroupData({
      group_name: '',
      meeting_day: 'Monday',
      expected_amount: 5000,
      frequency: 'Weekly',
      cycle_label: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Group"
      size="md"
    >
      <div className="p-6 space-y-4">
        {formErrors.submit && (
          <ErrorDisplay error={formErrors.submit} variant="inline" />
        )}

        <SimpleInput
          label="Group Name"
          required
          error={formErrors.group_name}
          value={newGroupData.group_name}
          onChange={(e) =>
            setNewGroupData({ ...newGroupData, group_name: e.target.value })
          }
          placeholder="e.g., Ibimina y'Urubyiruko"
        />

        <div className="grid grid-cols-2 gap-4">
          <SimpleSelect
            label="Contribution Day"
            error={formErrors.meeting_day}
            value={newGroupData.meeting_day}
            onChange={(e) =>
              setNewGroupData({ ...newGroupData, meeting_day: e.target.value })
            }
            options={[
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday',
            ].map((day) => ({ value: day, label: day }))}
          />
          <SimpleSelect
            label="Frequency"
            error={formErrors.frequency}
            value={newGroupData.frequency}
            onChange={(e) =>
              setNewGroupData({
                ...newGroupData,
                frequency: e.target.value as 'Weekly' | 'Monthly',
              })
            }
            options={[
              { value: 'Weekly', label: 'Weekly' },
              { value: 'Monthly', label: 'Monthly' },
            ]}
          />
        </div>

        <SimpleInput
          label="Contribution Amount (RWF)"
          type="number"
          error={formErrors.expected_amount}
          value={newGroupData.expected_amount}
          onChange={(e) =>
            setNewGroupData({
              ...newGroupData,
              expected_amount: Number(e.target.value),
            })
          }
          placeholder="5000"
        />

        <SimpleInput
          label="Cycle Label (optional)"
          error={formErrors.cycle_label}
          value={newGroupData.cycle_label}
          onChange={(e) =>
            setNewGroupData({ ...newGroupData, cycle_label: e.target.value })
          }
          placeholder="e.g., Cycle 2026"
        />
      </div>

      <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleCreateGroup}
          isLoading={isSubmitting}
          leftIcon={<Plus size={16} />}
        >
          Create Group
        </Button>
      </div>
    </Modal>
  );
};
