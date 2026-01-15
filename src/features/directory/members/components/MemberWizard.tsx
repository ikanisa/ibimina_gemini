import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, User, Users, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/core/auth';
import { Modal, Button, FormField, ErrorDisplay } from '@/shared/components/ui';
import { WizardProgress } from '@/shared/components/ui';

interface MemberWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prefilledPhone?: string;
  prefilledGroupId?: string;
}

interface Group {
  id: string;
  group_name: string;
  group_code?: string;
}

interface MemberData {
  full_name: string;
  member_code: string;
  phone_primary: string;
  phone_alt: string;
  group_id: string | null;
}

const MemberWizard: React.FC<MemberWizardProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  prefilledPhone,
  prefilledGroupId,
}) => {
  const { institutionId } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupSearch, setGroupSearch] = useState('');
  
  const [formData, setFormData] = useState<MemberData>({
    full_name: '',
    member_code: '',
    phone_primary: prefilledPhone || '',
    phone_alt: '',
    group_id: prefilledGroupId || null,
  });

  const steps = [
    { id: 'identity', label: 'Identity', description: 'Basic info' },
    { id: 'group', label: 'Group', description: 'Select group' },
    { id: 'review', label: 'Review', description: 'Confirm' },
  ];

  // Load groups for institution
  useEffect(() => {
    if (!institutionId || !isOpen) return;

    const loadGroups = async () => {
      const { data } = await supabase
        .from('groups')
        .select('id, group_name, group_code')
        .eq('institution_id', institutionId)
        .eq('status', 'ACTIVE')
        .order('group_name');
      
      if (data) setGroups(data);
    };

    loadGroups();
  }, [institutionId, isOpen]);

  // Filter groups by search
  const filteredGroups = groups.filter(g => 
    g.group_name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    (g.group_code || '').toLowerCase().includes(groupSearch.toLowerCase())
  );

  const selectedGroup = groups.find(g => g.id === formData.group_id);

  const generateMemberCode = (name: string): string => {
    const prefix = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `M-${prefix}${random}`;
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 15;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate identity
      if (!formData.full_name.trim()) {
        setError('Full name is required');
        return;
      }
      if (formData.phone_primary && !validatePhone(formData.phone_primary)) {
        setError('Invalid phone number format');
        return;
      }
      // Auto-generate member code if empty
      if (!formData.member_code.trim()) {
        setFormData(prev => ({ ...prev, member_code: generateMemberCode(prev.full_name) }));
      }
    }
    if (currentStep === 1) {
      // Group is optional but recommended
      if (!formData.group_id) {
        // Allow proceeding without group
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
      const { data, error: rpcError } = await supabase.rpc('create_member', {
        p_institution_id: institutionId,
        p_group_id: formData.group_id,
        p_full_name: formData.full_name.trim(),
        p_member_code: formData.member_code.trim() || null,
        p_phone_primary: formData.phone_primary.trim() || null,
        p_phone_alt: formData.phone_alt.trim() || null,
      });

      if (rpcError) throw rpcError;

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFormData({
      full_name: '',
      member_code: '',
      phone_primary: prefilledPhone || '',
      phone_alt: '',
      group_id: prefilledGroupId || null,
    });
    setGroupSearch('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Member" size="md">
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

        {/* Step 1: Identity */}
        {currentStep === 0 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <FormField label="Full Name" required>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="e.g., Jean Pierre Habimana"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </FormField>

            <FormField label="Member Code" hint="Auto-generated if left blank">
              <input
                type="text"
                value={formData.member_code}
                onChange={(e) => setFormData(prev => ({ ...prev, member_code: e.target.value.toUpperCase() }))}
                placeholder="e.g., M-JP001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </FormField>

            <FormField label="Primary Phone" hint="Format: 0788123456 or +250788123456">
              <input
                type="tel"
                value={formData.phone_primary}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_primary: e.target.value }))}
                placeholder="e.g., 0788123456"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>

            <FormField label="Alternative Phone" hint="Optional">
              <input
                type="tel"
                value={formData.phone_alt}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_alt: e.target.value }))}
                placeholder="e.g., 0788654321"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </div>
        )}

        {/* Step 2: Select Group */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <FormField label="Search Groups">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Search by name or code..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </FormField>

            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {filteredGroups.length > 0 ? (
                filteredGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setFormData(prev => ({ ...prev, group_id: group.id }))}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      formData.group_id === group.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium text-slate-900">{group.group_name}</p>
                      {group.group_code && (
                        <p className="text-xs text-slate-500 font-mono">{group.group_code}</p>
                      )}
                    </div>
                    {formData.group_id === group.id && (
                      <Check size={18} className="text-blue-600" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No groups found</p>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 text-center">
              {formData.group_id ? 'Group selected' : 'Select a group or skip to add member without a group'}
            </p>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{formData.full_name}</h3>
                  <p className="text-sm text-slate-500 font-mono">{formData.member_code || 'Auto-generated'}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Primary Phone:</span>
                  <span className="font-medium text-slate-900">{formData.phone_primary || '—'}</span>
                </div>
                {formData.phone_alt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Alt Phone:</span>
                    <span className="font-medium text-slate-900">{formData.phone_alt}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Group:</span>
                  <span className="font-medium text-slate-900">
                    {selectedGroup?.group_name || 'No group assigned'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 text-center">
              Click "Add Member" to create this member.
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
            {currentStep === 1 && !formData.group_id ? 'Skip' : 'Next'}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<Check size={16} />}
            className="bg-green-600 hover:bg-green-700"
          >
            Add Member
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default MemberWizard;

