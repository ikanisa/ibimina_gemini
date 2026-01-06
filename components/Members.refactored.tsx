/**
 * Members Component - Refactored Version
 * 
 * This is a refactored example showing how to use the new hooks and API services.
 * This can be used as a template for migrating other components.
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, MoreHorizontal, Smartphone, ShieldCheck, UserCheck, X, User, FileText, CreditCard, History, Briefcase, Edit, Lock, Ban, CheckCircle, Plus, Upload } from 'lucide-react';
import { ViewState, Member } from '../types';
import { MOCK_MEMBERS } from '../constants';
import { useMembers } from '../hooks';
import { transformMembers } from '../lib/transformers';
import { validateMemberData } from '../lib/validation';
import { Modal, LoadingSpinner, ErrorDisplay, EmptyState, Button, FormField, SearchInput, Badge } from './ui';
import BulkMemberUpload from './BulkMemberUpload';
import { useAuth } from '../contexts/AuthContext';

interface MembersProps {
  members?: Member[];
  onNavigate?: (view: ViewState) => void;
}

type Tab = 'Profile' | 'Accounts' | 'Transactions' | 'Documents' | 'Tokens';

const Members: React.FC<MembersProps> = ({ members: membersProp, onNavigate }) => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const { institutionId } = useAuth();
  
  // Use the new hook instead of manual state management
  const {
    members: supabaseMembers,
    loading,
    error,
    createMember: createMemberApi,
    updateMember,
    deleteMember
  } = useMembers({
    includeGroups: true,
    autoFetch: !useMockData && !membersProp
  });

  // Transform Supabase members to UI format
  const members = useMemo(() => {
    if (membersProp) return membersProp;
    if (useMockData) return MOCK_MEMBERS;
    if (!supabaseMembers.length) return [];
    
    // Transform using the transformer utility
    return transformMembers(supabaseMembers);
  }, [membersProp, useMockData, supabaseMembers]);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Profile');

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newMemberData, setNewMemberData] = useState({
    full_name: '',
    phone: '',
    branch: 'HQ'
  });

  // Bulk Upload Modal State
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Handle Add Member with validation
  const handleAddMember = async () => {
    if (!institutionId) {
      setFormErrors({ submit: 'No institution selected' });
      return;
    }

    // Validate using validation utility
    const validation = validateMemberData(newMemberData);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      await createMemberApi({
        institution_id: institutionId,
        full_name: validation.normalized?.phone 
          ? newMemberData.full_name 
          : newMemberData.full_name,
        phone: validation.normalized?.phone || newMemberData.phone,
        branch: newMemberData.branch || 'HQ'
      });

      // Reset form and close modal
      setNewMemberData({ full_name: '', phone: '', branch: 'HQ' });
      setIsAddModalOpen(false);
    } catch (err) {
      setFormErrors({ 
        submit: err instanceof Error ? err.message : 'Failed to add member' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter members with debounced search (could use useDebounce hook)
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const term = searchTerm.toLowerCase();
    return members.filter(m =>
      m.name.toLowerCase().includes(term) ||
      m.phone.includes(term)
    );
  }, [members, searchTerm]);

  // Loading state
  if (loading) {
    return <LoadingSpinner size="lg" text="Loading members..." />;
  }

  return (
    <>
      <div className="relative h-[calc(100vh-100px)] flex gap-6">
        {/* List Section */}
        <div className={`flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ${selectedMember ? 'w-1/2 hidden lg:flex' : 'w-full'}`}>
          {/* Error Display */}
          {error && (
            <ErrorDisplay 
              error={error} 
              variant="banner"
              onDismiss={() => {/* Clear error if needed */}}
            />
          )}

          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div className="relative w-64">
              <SearchInput
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg">
                <Filter size={18} />
              </button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Upload size={16} />}
                onClick={() => setIsBulkUploadOpen(true)}
              >
                Bulk Upload
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add Member
              </Button>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-4">Member</div>
            <div className="col-span-3">Ibimina (Groups)</div>
            <div className="col-span-2 text-right">Savings</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Body */}
          <div className="overflow-y-auto flex-1">
            {filteredMembers.length === 0 ? (
              <EmptyState
                icon={User}
                title="No members found"
                description={useMockData 
                  ? "No members match your search." 
                  : "Add members to get started."}
                action={
                  <Button
                    variant="primary"
                    leftIcon={<Plus size={16} />}
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    Add First Member
                  </Button>
                }
              />
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => { setSelectedMember(member); setActiveTab('Profile'); }}
                  className={`grid grid-cols-12 px-4 py-3 items-center border-b border-slate-50 cursor-pointer hover:bg-blue-50/50 transition-colors ${selectedMember?.id === member.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.phone}</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-sm text-slate-600">
                    {member.groups.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.groups.slice(0, 2).map((group, idx) => (
                          <span key={idx} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-100 truncate max-w-[100px]">
                            {group}
                          </span>
                        ))}
                        {member.groups.length > 2 && (
                          <span className="text-[10px] text-slate-400">+{member.groups.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">No groups</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium text-slate-900">
                    {member.savingsBalance.toLocaleString()} RWF
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Badge
                      variant={member.status === 'Active' ? 'success' : member.status === 'Pending' ? 'warning' : 'danger'}
                    >
                      {member.status}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex justify-end text-slate-400">
                    <MoreHorizontal size={16} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Drawer - Keep existing implementation */}
        {selectedMember && (
          <div className="w-full lg:w-1/2 bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">
            {/* ... existing detail drawer code ... */}
          </div>
        )}
      </div>

      {/* Add Member Modal - Using new Modal component */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Member"
        size="md"
      >
        <div className="p-6 space-y-4">
          {formErrors.submit && (
            <ErrorDisplay error={formErrors.submit} variant="inline" />
          )}

          <FormField label="Full Name" required error={formErrors.full_name}>
            <input
              type="text"
              value={newMemberData.full_name}
              onChange={(e) => setNewMemberData({ ...newMemberData, full_name: e.target.value })}
              placeholder="e.g., Jean Pierre Habimana"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <FormField label="Phone Number" required error={formErrors.phone}>
            <input
              type="tel"
              value={newMemberData.phone}
              onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
              placeholder="e.g., +250788123456"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <FormField label="Branch" error={formErrors.branch}>
            <input
              type="text"
              value={newMemberData.branch}
              onChange={(e) => setNewMemberData({ ...newMemberData, branch: e.target.value })}
              placeholder="e.g., HQ, Kigali, Huye"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => setIsAddModalOpen(false)}
          >
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

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <BulkMemberUpload
          onClose={() => setIsBulkUploadOpen(false)}
          onSuccess={() => {
            setIsBulkUploadOpen(false);
            // Hook will automatically refetch
          }}
        />
      )}
    </>
  );
};

export default Members;

