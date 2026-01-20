import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth';
import { Modal, Button, FormField, ErrorDisplay } from '@/shared/components/ui';
import { WizardProgress } from '@/shared/components/ui';

interface GroupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface GroupData {
  name: string;
  group_code: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  expected_amount: number;
}

const GroupWizard: React.FC<GroupWizardProps> = ({ isOpen, onClose, onSuccess }) => {
  const { institutionId } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<GroupData>({
    name: '',
    group_code: '',
    frequency: 'Weekly',
    expected_amount: 5000,
  });

  const steps = [
    { id: 'details', label: 'Details', description: 'Basic info' },
    { id: 'review', label: 'Review', description: 'Confirm' },
  ];

  const generateGroupCode = (name: string): string => {
    const prefix = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 3);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${random}`;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate step 1
      if (!formData.name.trim()) {
        setError('Group name is required');
        return;
      }
      // Auto-generate code if empty
      if (!formData.group_code.trim()) {
        setFormData(prev => ({ ...prev, group_code: generateGroupCode(prev.name) }));
      }
    }
    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!institutionId) {
      setError('No institution selected');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('create_group', {
        p_institution_id: institutionId,
        p_name: formData.name.trim(),
        p_group_code: formData.group_code.trim() || null,
        p_frequency: formData.frequency,
        p_expected_amount: formData.expected_amount,
      });

      if (rpcError) throw rpcError;

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFormData({
      name: '',
      group_code: '',
      frequency: 'Weekly',
      expected_amount: 5000,
    });
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Group" size="md">
      {/* Wizard Progress */}
      <div className="px-6 pt-4 pb-4 border-b border-slate-200">
        <WizardProgress
          steps={steps}
          currentStep={currentStep}
          completedSteps={Array.from({ length: currentStep }, (_, i) => i + 1)}
        />
      </div>

      {/* Content */}
      <div className="p-6">
        {error && <ErrorDisplay error={error} variant="inline" className="mb-4" />}

        {/* Step 1: Details */}
        {currentStep === 0 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <FormField label="Group Name" required>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Ibimina y'Urubyiruko"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </FormField>

            <FormField label="Group Code" hint="Auto-generated if left blank">
              <input
                type="text"
                value={formData.group_code}
                onChange={(e) => setFormData(prev => ({ ...prev, group_code: e.target.value.toUpperCase() }))}
                placeholder="e.g., IBY-001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </FormField>

            <FormField label="Frequency">
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as 'Daily' | 'Weekly' | 'Monthly' }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </FormField>

            <FormField label="Contribution Amount (RWF)">
              <input
                type="number"
                value={formData.expected_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_amount: Number(e.target.value) }))}
                placeholder="5000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </div>
        )}

        {/* Step 2: Review */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{formData.name}</h3>
                  <p className="text-sm text-slate-500 font-mono">{formData.group_code || 'Auto-generated'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Frequency:</span>
                  <span className="ml-2 font-medium text-slate-900">{formData.frequency}</span>
                </div>
                <div>
                  <span className="text-slate-500">Contribution:</span>
                  <span className="ml-2 font-medium text-slate-900">{formData.expected_amount.toLocaleString()} RWF</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 text-center">
              Click "Create Group" to add this group to your institution.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-200 flex justify-between">
        <Button
          variant="secondary"
          onClick={currentStep === 0 ? handleClose : handleBack}
          leftIcon={currentStep > 0 ? <ArrowLeft size={16} /> : undefined}
        >
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            variant="primary"
            onClick={handleNext}
            rightIcon={<ArrowRight size={16} />}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<Check size={16} />}
            className="bg-green-600 hover:bg-green-700"
          >
            Create Group
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default GroupWizard;
